import type { Express } from "express";
import { adminAuth } from "../../lib/firebase-admin.ts";
import { db, users } from "../../db/index.ts";
import { eq, ilike, or } from "drizzle-orm";
import { sendEmail } from "../mail.ts";

interface PendingRegistration {
  name: string;
  email: string;
  phone: string;
  password?: string;
  address?: string;
  birthday?: string;
  username?: string;
  otp: string;
  expiresAt: number;
}

const signupOtps = new Map<string, PendingRegistration>();

export function registerAuthRoutes(app: Express) {
  // Google Login with Firebase Token Verification
  app.post("/api/auth/google-login", async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Thiếu ID Token." });
    }
  
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const { uid, email, name } = decodedToken;
  
      // Save or update user profile in PostgreSQL database
      const [dbUser] = await db.insert(users)
        .values({
          uid,
          email: email || "",
          name: name || email?.split("@")[0] || "User",
          phone: "",
          role: "user",
          emailVerified: 1,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: email || "",
            name: name || email?.split("@")[0] || "User",
          }
        })
        .returning();
  
      res.json({
        uid: dbUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        gender: dbUser.gender,
        birthday: dbUser.birthday,
        address: dbUser.address,
        emailVerified: true, // Google login is pre-verified
      });
    } catch (error) {
      console.error("Lỗi xác thực token Google Auth:", error);
      res.status(401).json({ error: "Xác thực Google Sign-In thất bại. Vui lòng thử lại." });
    }
  });
  
  // Failed login attempts tracker: map key (email or username) -> { count, lockUntil }
  interface FailedAttempt {
    count: number;
    lockUntil: number;
  }
  const failedLoginsMap = new Map<string, FailedAttempt>();
  
  function recordFailedAttempt(key: string): string {
    const current = failedLoginsMap.get(key) || { count: 0, lockUntil: 0 };
    let newCount = current.count;
    if (current.lockUntil && current.lockUntil < Date.now()) {
      newCount = 1;
    } else {
      newCount = current.count + 1;
    }
  
    if (newCount >= 5) {
      failedLoginsMap.set(key, { count: newCount, lockUntil: Date.now() + 30 * 60 * 1000 });
      return "Bạn đã nhập sai quá số lần quy định, vui lòng thử lại sau 30 phút";
    } else {
      failedLoginsMap.set(key, { count: newCount, lockUntil: 0 });
      return "Sai tên đăng nhập hoặc mật khẩu";
    }
  }
  
  // Register User with OTP email verification (only added to DB after verification)
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password, address, birthday, username } = req.body;
    if (!name || !email || !phone || !password || !address || !birthday || !username) {
      return res.status(400).json({ error: "Nhập tài khoản!" });
    }
  
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanUsername = username.trim();
      const cleanPhone = phone.trim();
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  
      // Validate username: length 4-50, no leading digit, alphanumeric only
      if (
        cleanUsername.length < 4 ||
        cleanUsername.length > 50 ||
        /^[0-9]/.test(cleanUsername) ||
        !/^[a-zA-Z0-9]+$/.test(cleanUsername)
      ) {
        return res.status(400).json({ error: "Tên đăng nhập không hợp lệ" });
      }
  
      // Check if username already exists in database (case-insensitive)
      const existingUsernames = await db.select().from(users).where(ilike(users.username, cleanUsername));
      if (existingUsernames.length > 0) {
        return res.status(400).json({ error: "Tên đăng nhập đã có người sử dụng" });
      }
  
      // Validate phone number format
      const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (ví dụ: 0987654321)." });
      }
  
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: "Email không hợp lệ" });
      }
  
      // Check password rules
      if (password.length < 6) {
        return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 kí tự" });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: "Mật khẩu không hợp lệ" });
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
        return res.status(400).json({ error: "Mật khẩu phải chứa ký tự đặc biệt (@, #, !,...)!" });
      }
  
      // Check if email already exists in database (case-insensitive)
      const existingUsers = await db.select().from(users).where(ilike(users.email, cleanEmail));
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Email đã có người sử dụng" });
      }
  
      // Check if phone already exists in database
      let phoneFormat1 = cleanPhone;
      let phoneFormat2 = cleanPhone;
      if (cleanPhone.startsWith("+84")) {
        phoneFormat2 = "0" + cleanPhone.slice(3);
      } else if (cleanPhone.startsWith("0")) {
        phoneFormat2 = "+84" + cleanPhone.slice(1);
      }
  
      const existingPhones = await db.select().from(users).where(
        or(
          eq(users.phone, phoneFormat1),
          eq(users.phone, phoneFormat2)
        )
      );
      if (existingPhones.length > 0) {
        return res.status(400).json({ error: "Số điện thoại đã có người sử dụng" });
      }
  
      // Generate random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
      // Save pending registration details in memory
      signupOtps.set(cleanEmail, {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: password || "",
        address: address || "",
        birthday: birthday || "",
        username: cleanUsername,
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
  
      // Send styled OTP Email
      const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 20px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px; letter-spacing: 3px;">
            IVY MODA
          </div>
          <div style="padding: 24px; color: #333333; line-height: 1.6;">
            <h2 style="color: #000000; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #b41b1b; padding-bottom: 8px; margin-bottom: 20px;">
              MÃ XÁC MINH ĐĂNG KÝ TÀI KHOẢN
            </h2>
            <p>Kính chào Quý khách,</p>
            <p>Quý khách đã gửi yêu cầu đăng ký thành viên tại hệ thống thời trang <strong>IVY moda</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực Gmail:</p>
            
            <div style="background-color: #f9f9f9; border: 1px dashed #000000; padding: 18px; border-radius: 6px; font-size: 28px; font-weight: black; letter-spacing: 6px; text-align: center; color: #b41b1b; margin: 25px 0; font-family: monospace;">
              ${otp}
            </div>
            
            <p style="font-size: 12px; color: #666666; margin-top: 15px;">Mã OTP này có hiệu lực sử dụng trong vòng <strong>5 phút</strong>. Quý khách vui lòng không chia sẻ mã số bảo mật này cho bất kỳ ai khác.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            <p style="font-size: 11px; color: #999999; text-align: center;">Đây là email tự động gửi từ hệ thống IVY moda. Vui lòng không trả lời trực tiếp email này.</p>
          </div>
        </div>
      `;
  
      sendEmail({
        to: cleanEmail,
        subject: `[IVY moda] Mã OTP xác minh đăng ký tài khoản: ${otp}`,
        html: mailHtml
      }).catch(err => console.error("Lỗi gửi mail đăng ký:", err));
  
      res.json({
        success: true,
        email: cleanEmail,
        name: name.trim(),
        phone: cleanPhone,
        message: `Mã OTP đã được gửi thành công đến email ${cleanEmail}.`
      });
    } catch (error: any) {
      console.error("Error creating user registration OTP:", error);
      res.status(500).json({ 
        error: "Lỗi hệ thống, vui lòng thử lại sau"
      });
    }
  });
  
  // Login User with Password verification
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập tài khoản và mật khẩu" });
    }
  
    try {
      const inputKey = email.toLowerCase().trim();
  
      // Check if user is locked out due to 5 failed attempts
      const attempt = failedLoginsMap.get(inputKey);
      if (attempt && attempt.lockUntil > Date.now()) {
        return res.status(400).json({ error: "Bạn đã nhập sai quá số lần quy định, vui lòng thử lại sau 30 phút" });
      }
  
      // Auto-promote admin@gmail.com or admin@ivy.com to admin role if they exist
      if (inputKey === "admin@gmail.com" || inputKey === "admin@ivy.com") {
        const matchedUsers = await db.select().from(users).where(eq(users.email, inputKey));
        if (matchedUsers.length > 0) {
          const user = matchedUsers[0];
          if (user.password && user.password !== password) {
            const msg = recordFailedAttempt(inputKey);
            return res.status(400).json({ error: msg });
          }
          failedLoginsMap.delete(inputKey);
          if (user.role !== "admin") {
            const [updatedAdmin] = await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id)).returning();
            return res.json({
              uid: updatedAdmin.uid,
              name: updatedAdmin.name,
              email: updatedAdmin.email,
              phone: updatedAdmin.phone,
              role: "admin",
              gender: updatedAdmin.gender,
              birthday: updatedAdmin.birthday,
              address: updatedAdmin.address,
              emailVerified: updatedAdmin.emailVerified === 1,
            });
          }
        }
      }
  
      // Support login with email or username
      let matchedUsers = [];
      if (inputKey.includes("@")) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(inputKey)) {
          return res.status(400).json({ error: "Email không hợp lệ" });
        }
        matchedUsers = await db.select().from(users).where(ilike(users.email, inputKey));
        if (matchedUsers.length === 0) {
          return res.status(400).json({ error: "Email chưa được đăng kí" });
        }
      } else {
        matchedUsers = await db.select().from(users).where(ilike(users.username, inputKey));
        if (matchedUsers.length === 0) {
          const msg = recordFailedAttempt(inputKey);
          return res.status(400).json({ error: msg });
        }
      }
  
      const user = matchedUsers[0];
  
      // Verify password if it's set in database
      if (user.password && user.password !== password) {
        const msg = recordFailedAttempt(inputKey);
        if (user.email) recordFailedAttempt(user.email.toLowerCase().trim());
        if (user.username) recordFailedAttempt(user.username.toLowerCase().trim());
        return res.status(400).json({ error: msg });
      }
  
      // Success login -> reset failed attempts
      failedLoginsMap.delete(inputKey);
      if (user.email) failedLoginsMap.delete(user.email.toLowerCase().trim());
      if (user.username) failedLoginsMap.delete(user.username.toLowerCase().trim());
  
        // Check if email is verified
        if (user.emailVerified !== 1) {
          // Generate random 6-digit OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const realEmail = user.email.toLowerCase().trim();
  
          // Save pending registration/verification in memory map with key as the real email address
          signupOtps.set(realEmail, {
            name: user.name,
            email: realEmail,
            phone: user.phone || "0912345678",
            password: user.password || "",
            address: user.address || "",
            birthday: user.birthday || "",
            username: user.username || "",
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
          });
  
          // Send OTP email
          const mailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
              <div style="background-color: #000000; padding: 20px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px; letter-spacing: 3px;">
                IVY MODA
              </div>
              <div style="padding: 24px; color: #333333; line-height: 1.6;">
                <h2 style="color: #000000; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #b41b1b; padding-bottom: 8px; margin-bottom: 20px;">
                  MÃ XÁC MINH TÀI KHOẢN CHƯA KÍCH HOẠT
                </h2>
                <p>Kính chào Quý khách <strong>${user.name}</strong>,</p>
                <p>Tài khoản của bạn tại <strong>IVY moda</strong> chưa được kích hoạt/xác thực email (hoặc bạn vừa đổi sang email mới). Vui lòng sử dụng mã OTP dưới đây để xác thực:</p>
                
                <div style="background-color: #f9f9f9; border: 1px dashed #000000; padding: 18px; border-radius: 6px; font-size: 28px; font-weight: black; letter-spacing: 6px; text-align: center; color: #b41b1b; margin: 25px 0; font-family: monospace;">
                  ${otp}
                </div>
                
                <p style="font-size: 12px; color: #666666;">Mã xác thực có hiệu lực trong vòng 5 phút.</p>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
                <p style="font-size: 11px; color: #999999; text-align: center;">IVY moda CSKH Team.</p>
              </div>
            </div>
          `;
  
          sendEmail({
            to: user.email,
            subject: `[IVY moda] Mã OTP kích hoạt tài khoản đăng nhập: ${otp}`,
            html: mailHtml
          }).catch(mailErr => {
            console.error("Lỗi gửi mail kích hoạt:", mailErr);
          });
  
          return res.status(403).json({
            unverified: true,
            email: user.email,
            error: "Vui lòng xác thực gmail"
          });
        }
  
        return res.json({
          uid: user.uid,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          gender: user.gender,
          birthday: user.birthday,
          address: user.address,
          emailVerified: true,
        });
    } catch (error: any) {
      console.error("Error logging in:", error);
      res.status(500).json({ 
        error: "Lỗi hệ thống, vui lòng thử lại sau" 
      });
    }
  });
  
  // API: Resend Verification Email OTP
  app.post("/api/auth/resend-verification", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email không được để trống." });
    }
    try {
      const cleanEmail = email.toLowerCase().trim();
      const record = signupOtps.get(cleanEmail);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
      if (record) {
        record.otp = otp;
        record.expiresAt = Date.now() + 5 * 60 * 1000;
        signupOtps.set(cleanEmail, record);
      } else {
        // Create temporary pending register in map for resending
        signupOtps.set(cleanEmail, {
          name: email.split("@")[0],
          email: cleanEmail,
          phone: "0912345678",
          otp,
          expiresAt: Date.now() + 5 * 60 * 1000
        });
      }
  
      const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 20px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px; letter-spacing: 3px;">
            IVY MODA
          </div>
          <div style="padding: 24px; color: #333333; line-height: 1.6;">
            <h2 style="color: #000000; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #b41b1b; padding-bottom: 8px; margin-bottom: 20px;">
              MÃ XÁC MINH ĐĂNG KÝ (GỬI LẠI)
            </h2>
            <p>Kính chào Quý khách,</p>
            <p>Quý khách đã yêu cầu gửi lại mã xác minh Gmail cho tài khoản tại <strong>IVY moda</strong>. Vui lòng sử dụng mã OTP dưới đây:</p>
            
            <div style="background-color: #f9f9f9; border: 1px dashed #000000; padding: 18px; border-radius: 6px; font-size: 28px; font-weight: black; letter-spacing: 6px; text-align: center; color: #b41b1b; margin: 25px 0; font-family: monospace;">
              ${otp}
            </div>
            
            <p style="font-size: 12px; color: #666666;">Mã xác thực có hiệu lực trong vòng 5 phút.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            <p style="font-size: 11px; color: #999999; text-align: center;">IVY moda CSKH Team.</p>
          </div>
        </div>
      `;
  
      sendEmail({
        to: cleanEmail,
        subject: `[IVY moda] Gửi lại mã OTP xác minh tài khoản mới: ${otp}`,
        html: mailHtml
      }).catch(err => console.error("Lỗi gửi lại mail OTP:", err));
  
      res.json({ success: true, message: `Mã xác thực mới đã được gửi thành công đến email ${cleanEmail}!` });
    } catch (error: any) {
      console.error("Lỗi gửi lại OTP:", error);
      res.status(500).json({ 
        error: "Lỗi hệ thống khi gửi lại mã xác thực.", 
        details: error?.message || String(error) 
      });
    }
  });
  
  // API: Verify Email and complete Sign-Up insertion
  app.post("/api/auth/verify-email", async (req, res) => {
    const { email, code } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email không hợp lệ." });
    }
    try {
      const cleanEmail = email.toLowerCase().trim();
      const record = signupOtps.get(cleanEmail);
  
      if (record) {
        // If code doesn't match and isn't the fallback demo code, return error
        if (code !== record.otp && code !== "123456") {
          return res.status(400).json({ error: "Mã OTP xác minh không hợp lệ. Vui lòng thử lại." });
        }
        if (Date.now() > record.expiresAt && code !== "123456") {
          return res.status(400).json({ error: "Mã OTP đã hết hạn sử dụng. Vui lòng gửi lại mã xác thực mới." });
        }
  
        // Check if user already exists in database
        const matched = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
        if (matched.length > 0) {
          // CASE B: Existing user verification. Update status!
          const [updatedUser] = await db.update(users)
            .set({ emailVerified: 1 })
            .where(eq(users.email, cleanEmail))
            .returning();
  
          signupOtps.delete(cleanEmail);
  
          return res.json({
            success: true,
            message: "Xác thực tài khoản thành công!",
            user: {
              uid: updatedUser.uid,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              role: updatedUser.role,
              gender: updatedUser.gender,
              birthday: updatedUser.birthday,
              address: updatedUser.address,
              emailVerified: true,
            }
          });
        }
  
        // CASE A: Officially register user in SQL Database
        const offlineUid = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const [newUser] = await db.insert(users)
          .values({
            uid: offlineUid,
            email: record.email,
            name: record.name,
            phone: record.phone,
            password: record.password || "",
            address: record.address || "",
            birthday: record.birthday || "",
            username: record.username || "",
            role: "user",
            emailVerified: 1, // Marked verified
          })
          .returning();
  
        signupOtps.delete(cleanEmail);
  
        return res.json({
          success: true,
          message: "Xác thực tài khoản thành công!",
          user: {
            uid: newUser.uid,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            gender: newUser.gender,
            birthday: newUser.birthday,
            address: newUser.address,
            emailVerified: true,
          }
        });
      } else {
        // Fallback/Existing user verification from Profile section
        const matched = await db.select().from(users).where(eq(users.email, cleanEmail));
        if (matched.length === 0) {
          return res.status(404).json({ error: "Yêu cầu xác nhận không tồn tại hoặc đã quá hạn." });
        }
        
        // Verification screen fallback bypass or mock
        if (code !== "123456") {
          return res.status(400).json({ error: "Mã xác thực không đúng." });
        }
  
        const [updatedUser] = await db.update(users)
          .set({ emailVerified: 1 })
          .where(eq(users.email, cleanEmail))
          .returning();
  
        return res.json({
          success: true,
          message: "Xác thực tài khoản thành công!",
          user: {
            uid: updatedUser.uid,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            gender: updatedUser.gender,
            birthday: updatedUser.birthday,
            address: updatedUser.address,
            emailVerified: true,
          }
        });
      }
    } catch (error: any) {
      console.error("Lỗi verify email:", error);
      res.status(500).json({ 
        error: "Lỗi hệ thống khi xác nhận mã OTP.", 
        details: error?.message || String(error) 
      });
    }
  });
  
  // API: Forgot Password (Generate new password and send via email)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Vui lòng nhập email của bạn." });
    }
    try {
      const cleanEmail = email.toLowerCase().trim();
      const matched = await db.select().from(users).where(eq(users.email, cleanEmail));
      
      if (matched.length === 0) {
        return res.status(404).json({ error: "Địa chỉ email này chưa được đăng ký trong hệ thống." });
      }
  
      // Generate random secure temporary password
      const tempPassword = `IVY${Math.floor(100000 + Math.random() * 900000)}`;
  
      // Update user password in Database
      await db.update(users).set({ password: tempPassword }).where(eq(users.email, cleanEmail));
  
      // Send Password recovery email
      const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 20px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px; letter-spacing: 3px;">
            IVY MODA
          </div>
          <div style="padding: 24px; color: #333333; line-height: 1.6;">
            <h2 style="color: #000000; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #b41b1b; padding-bottom: 8px; margin-bottom: 20px;">
              MẬT KHẨU TẠM THỜI MỚI
            </h2>
            <p>Kính chào Quý khách,</p>
            <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu tài khoản tại <strong>IVY moda</strong> của Quý khách.</p>
            <p>Mật khẩu tạm thời mới để đăng nhập tài khoản là:</p>
            
            <div style="background-color: #f5f5f5; border: 1px solid #000000; padding: 15px; border-radius: 6px; font-size: 22px; font-weight: bold; text-align: center; color: #b41b1b; margin: 25px 0; font-family: monospace;">
              ${tempPassword}
            </div>
            
            <p>Quý khách vui lòng đăng nhập bằng mật khẩu tạm thời này, sau đó truy cập mục <strong>Hồ sơ thành viên -> Thay đổi mật khẩu</strong> để cập nhật mật khẩu mới bảo mật nhất.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            <p style="font-size: 11px; color: #999999; text-align: center;">IVY moda CSKH Team.</p>
          </div>
        </div>
      `;
  
      sendEmail({
        to: cleanEmail,
        subject: `[IVY moda] Khôi phục mật khẩu tài khoản thành công`,
        html: mailHtml
      }).catch(err => console.error("Lỗi gửi mail khôi phục mật khẩu:", err));
  
      res.json({
        success: true,
        message: `Mật khẩu tạm thời đã được gửi thành công đến email ${cleanEmail}. Vui lòng kiểm tra hộp thư.`
      });
    } catch (error: any) {
      console.error("Lỗi forgot password:", error);
      res.status(500).json({ 
        error: "Lỗi hệ thống khi gửi yêu cầu quên mật khẩu.", 
        details: error?.message || String(error) 
      });
    }
  });
  
  // API: Change profile password (with email notification)
  app.post("/api/users/profile/change-password", async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu không hợp lệ (tối thiểu 6 ký tự)." });
    }
  
    try {
      const cleanEmail = email.toLowerCase().trim();
      const matched = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (matched.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tài khoản người dùng." });
      }
  
      // Update password
      await db.update(users).set({ password: newPassword }).where(eq(users.email, cleanEmail));
  
      // Send styled notification email
      const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 20px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px; letter-spacing: 3px;">
            IVY MODA
          </div>
          <div style="padding: 24px; color: #333333; line-height: 1.6;">
            <h2 style="color: #22c55e; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #22c55e; padding-bottom: 8px; margin-bottom: 20px;">
              MẬT KHẨU ĐÃ ĐƯỢC THAY ĐỔI
            </h2>
            <p>Kính chào Quý khách,</p>
            <p>Chúng tôi xin thông báo rằng mật khẩu tài khoản thành viên <strong>IVY moda</strong> của Quý khách đã được cập nhật thay đổi thành công vào lúc:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; font-weight: bold; text-align: center; color: #333333; margin: 15px 0;">
              ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
            </div>
            
            <p style="color: #ef4444; font-weight: bold;">Cảnh báo bảo mật:</p>
            <p style="font-size: 13px;">Nếu Quý khách không thực hiện thay đổi này, vui lòng liên hệ ngay lập tức với Hotline hỗ trợ của chúng tôi để bảo vệ tài khoản tránh rò rỉ dữ liệu.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
            <p style="font-size: 11px; color: #999999; text-align: center;">Đây là email bảo mật tự động gửi từ IVY moda.</p>
          </div>
        </div>
      `;
  
      sendEmail({
        to: cleanEmail,
        subject: `[IVY moda] Thông báo thay đổi mật khẩu tài khoản thành công`,
        html: mailHtml
      }).catch(err => console.error("Lỗi gửi mail đổi mật khẩu:", err));
  
      res.json({ success: true, message: "Mật khẩu đã được thay đổi thành công!" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi đổi mật khẩu." });
    }
  });
  
}
