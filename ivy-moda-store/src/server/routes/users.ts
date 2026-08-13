import type { Express } from "express";
import { db, users } from "../../db/index.ts";
import { and, desc, eq, ilike, ne, or } from "drizzle-orm";

export function registerUserRoutes(app: Express) {
  // ==========================================
  // USER PROFILE & ADMIN USER MANAGEMENT APIs
  // ==========================================
  
  // API: Get Single User Profile
  app.get("/api/users/profile", async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Thiếu email để lấy thông tin." });
    }
    try {
      const matched = await db.select().from(users).where(eq(users.email, (email as string).toLowerCase().trim()));
      if (matched.length > 0) {
        res.json(matched[0]);
      } else {
        res.status(404).json({ error: "Không tìm thấy hồ sơ người dùng này." });
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin hồ sơ:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi truy vấn hồ sơ." });
    }
  });
  
  // API: Update User Profile (User updating self)
  app.post("/api/users/profile/update", async (req, res) => {
    const { originalEmail, email, name, phone, gender, birthday, address } = req.body;
    const lookupEmail = (originalEmail || email || "").toLowerCase().trim();
    if (!lookupEmail) {
      return res.status(400).json({ error: "Thiếu email để thực hiện cập nhật." });
    }
    try {
      const emailStr = email ? email.toLowerCase().trim() : lookupEmail;
      const phoneStr = phone ? phone.trim() : "";
  
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;
      const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơưẠ-ỹ\s]{2,50}$/;
  
      if (name && !nameRegex.test(name.trim())) {
        return res.status(400).json({ error: "Họ tên không hợp lệ. Vui lòng chỉ nhập chữ cái và khoảng trắng (từ 2 đến 50 ký tự)." });
      }
      if (emailStr && !emailRegex.test(emailStr)) {
        return res.status(400).json({ error: "Địa chỉ email không đúng định dạng Gmail (ví dụ: name@gmail.com)." });
      }
      if (phoneStr && !phoneRegex.test(phoneStr)) {
        return res.status(400).json({ error: "Số điện thoại Việt Nam không hợp lệ. Vui lòng nhập đúng 10 chữ số." });
      }
  
      // Find the user first to know their ID
      const matchedUsers = await db.select().from(users).where(eq(users.email, lookupEmail)).limit(1);
      const existingUser = matchedUsers[0];
  
      if (existingUser) {
        // 1. Check if the new email belongs to another user
        if (emailStr !== existingUser.email) {
          const dupEmail = await db.select().from(users).where(eq(users.email, emailStr)).limit(1);
          if (dupEmail.length > 0) {
            return res.status(400).json({ error: "Email này đã được sử dụng bởi tài khoản khác." });
          }
        }
  
        // 2. Check if the new phone belongs to another user
        if (phoneStr && phoneStr !== existingUser.phone) {
          const dupPhone = await db.select().from(users).where(eq(users.phone, phoneStr)).limit(1);
          if (dupPhone.length > 0) {
            return res.status(400).json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
          }
        }
  
        // Update the user - do NOT allow updating email or changing emailVerified
        const updated = await db.update(users)
          .set({
            name: name ? name.trim() : undefined,
            phone: phoneStr || null,
            gender: gender || null,
            birthday: birthday || null,
            address: address ? address.trim() : null,
          })
          .where(eq(users.id, existingUser.id))
          .returning();
  
        return res.json({ success: true, user: updated[0] });
      } else {
        // If user does not exist in DB yet, check duplication for new registration
        if (emailStr) {
          const dupEmail = await db.select().from(users).where(eq(users.email, emailStr)).limit(1);
          if (dupEmail.length > 0) {
            return res.status(400).json({ error: "Email này đã được sử dụng bởi tài khoản khác." });
          }
        }
        if (phoneStr) {
          const dupPhone = await db.select().from(users).where(eq(users.phone, phoneStr)).limit(1);
          if (dupPhone.length > 0) {
            return res.status(400).json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
          }
        }
  
        const offlineUid = `offline_${Date.now()}`;
        const [newUser] = await db.insert(users).values({
          uid: offlineUid,
          email: emailStr,
          name: name || "Tên khách hàng",
          phone: phoneStr || "",
          gender: gender || null,
          birthday: birthday || null,
          address: address || null,
          role: "user"
        }).returning();
        return res.json({ success: true, user: newUser });
      }
    } catch (error) {
      console.error("Lỗi cập nhật thông tin hồ sơ người dùng:", error);
      res.status(500).json({ error: "Không thể lưu thông tin hồ sơ của bạn." });
    }
  });
  
  // API: Get All Users (Admin User Management Panel)
  app.get("/api/users", async (req, res) => {
    try {
      const list = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(list);
    } catch (error) {
      console.error("Lỗi truy vấn danh sách người dùng cho Admin:", error);
      res.status(500).json({ error: "Không thể truy xuất danh sách người dùng." });
    }
  });
  
  // API: Update User details from Admin Management Screen (Role & other info & password)
  app.post("/api/users/admin-update", async (req, res) => {
    const { id, name, email, phone, role, gender, birthday, address, password } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Mã người dùng (id) không hợp lệ." });
    }
  
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơưẠ-ỹ\s]{2,50}$/;
  
    if (name && !nameRegex.test(name.trim())) {
      return res.status(400).json({ error: "Họ tên không hợp lệ. Vui lòng chỉ nhập chữ cái và khoảng trắng (từ 2 đến 50 ký tự)." });
    }
    const emailStr = email ? email.toLowerCase().trim() : "";
    if (emailStr && !emailRegex.test(emailStr)) {
      return res.status(400).json({ error: "Địa chỉ email không đúng định dạng Gmail (ví dụ: name@gmail.com)." });
    }
    const phoneStr = phone ? phone.trim() : "";
    if (phoneStr && !phoneRegex.test(phoneStr)) {
      return res.status(400).json({ error: "Số điện thoại Việt Nam không hợp lệ. Vui lòng nhập đúng 10 chữ số." });
    }
  
    try {
      const userId = Number(id);
  
      // 1. Check duplicate email with another user (case-insensitive)
      if (emailStr) {
        const dupEmail = await db.select().from(users).where(
          and(
            ilike(users.email, emailStr),
            ne(users.id, userId)
          )
        );
        if (dupEmail.length > 0) {
          return res.status(400).json({ error: "Email này đã được sử dụng bởi tài khoản khác." });
        }
      }
  
      // 2. Check duplicate phone with another user (handling 0... and +84... formats)
      if (phoneStr) {
        let phoneFormat1 = phoneStr;
        let phoneFormat2 = phoneStr;
        if (phoneStr.startsWith("+84")) {
          phoneFormat2 = "0" + phoneStr.slice(3);
        } else if (phoneStr.startsWith("0")) {
          phoneFormat2 = "+84" + phoneStr.slice(1);
        }
  
        const dupPhone = await db.select().from(users).where(
          and(
            or(
              eq(users.phone, phoneFormat1),
              eq(users.phone, phoneFormat2)
            ),
            ne(users.id, userId)
          )
        );
        if (dupPhone.length > 0) {
          return res.status(400).json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
        }
      }
  
      const updated = await db.update(users)
        .set({
          name: name ? name.trim() : undefined,
          phone: phoneStr || undefined,
          role: role || undefined,
          gender: gender || null,
          birthday: birthday || null,
          address: address || null,
          password: password ? password.trim() : undefined, // Cập nhật mật khẩu nếu được nhập
        })
        .where(eq(users.id, userId))
        .returning();
  
      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy thông tin người dùng." });
      }
  
      res.json({ success: true, user: updated[0] });
    } catch (error) {
      console.error("Lỗi Admin cập nhật thông tin người dùng:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi cập nhật thông tin thành viên." });
    }
  });
  
  // API: Delete User (Admin operation)
  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await db.delete(users).where(eq(users.id, Number(id))).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy người dùng." });
      }
      res.json({ success: true, message: "Đã xóa người dùng thành công." });
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi xóa người dùng." });
    }
  });
  
}
