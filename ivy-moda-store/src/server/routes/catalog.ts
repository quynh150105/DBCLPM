import type { Express } from "express";
import { PRODUCTS, SHOWROOMS, DISCOUNT_CODES } from "../../data";
import { db, products as dbProducts, showrooms as dbShowrooms, coupons as dbCoupons, reviews as dbReviews, wishlist as dbWishlist, categories as dbCategories } from "../../db/index.ts";
import { and, desc, eq, ne } from "drizzle-orm";

export function registerCatalogRoutes(app: Express) {
  // API: Get Categories List
  app.get("/api/categories", async (req, res) => {
    try {
      const list = await db.select().from(dbCategories).orderBy(dbCategories.name);
      res.json(list);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      res.json([{ id: 1, name: "Nữ" }, { id: 2, name: "Nam" }, { id: 3, name: "Trẻ em" }]);
    }
  });
  
  // API: Create Category
  app.post("/api/categories", async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Tên danh mục không được để trống." });
    }
  
    try {
      const cleanName = name.trim();
      const existing = await db.select().from(dbCategories).where(eq(dbCategories.name, cleanName));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Danh mục này đã tồn tại." });
      }
  
      const [newCat] = await db.insert(dbCategories).values({ name: cleanName }).returning();
      res.json({ success: true, category: newCat });
    } catch (error) {
      console.error("Lỗi khi tạo danh mục mới:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi tạo danh mục mới." });
    }
  });
  
  // API: Get Products List from Database
  app.get("/api/products", async (req, res) => {
    try {
      const list = await db.select().from(dbProducts).orderBy(desc(dbProducts.createdAt));
      const formatted = list.map(p => ({
        id: p.prodId,
        sku: p.sku,
        name: p.name,
        category: p.category,
        subCategory: p.subCategory,
        price: p.price,
        originalPrice: p.originalPrice || undefined,
        badge: p.badge || undefined,
        images: p.images,
        description: p.description,
        colors: p.colors,
        sizes: p.sizes,
      }));
      res.json(formatted);
    } catch (error) {
      console.error("Lỗi truy vấn sản phẩm:", error);
      res.json(PRODUCTS); // Offline fallback
    }
  });
  
  // API: Admin Create/Add Product to Database
  app.post("/api/products/add", async (req, res) => {
    const { product } = req.body;
    if (!product || !product.sku || !product.name || !product.price) {
      return res.status(400).json({ error: "Thông tin sản phẩm chưa đầy đủ." });
    }
  
    try {
      const cleanSku = product.sku.trim().toUpperCase();
      const existing = await db.select().from(dbProducts).where(eq(dbProducts.sku, cleanSku));
      if (existing.length > 0) {
        return res.status(400).json({ error: `Mã SKU "${cleanSku}" đã tồn tại trên hệ thống. Vui lòng sử dụng mã SKU khác.` });
      }
  
      const generatedId = `prod-${Date.now()}`;
      const [newProduct] = await db.insert(dbProducts).values({
        prodId: generatedId,
        sku: cleanSku,
        name: product.name.trim(),
        category: product.category,
        subCategory: product.subCategory,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        badge: product.badge || null,
        images: Array.isArray(product.images) ? product.images : [product.images || ""],
        description: product.description || "",
        colors: product.colors || [],
        sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      }).returning();
  
      res.json({ success: true, product: {
        id: newProduct.prodId,
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        subCategory: newProduct.subCategory,
        price: newProduct.price,
        originalPrice: newProduct.originalPrice || undefined,
        badge: newProduct.badge || undefined,
        images: newProduct.images,
        description: newProduct.description,
        colors: newProduct.colors,
        sizes: newProduct.sizes,
      }});
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào database:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi thêm sản phẩm mới. Vui lòng thử lại sau." });
    }
  });
  
  // API: Admin Edit Product
  app.post("/api/products/edit", async (req, res) => {
    const { product } = req.body;
    if (!product || !product.id) {
      return res.status(400).json({ error: "Mã sản phẩm không hợp lệ." });
    }
  
    try {
      const cleanSku = product.sku.trim().toUpperCase();
      const existing = await db.select().from(dbProducts)
        .where(and(eq(dbProducts.sku, cleanSku), ne(dbProducts.prodId, product.id)));
      if (existing.length > 0) {
        return res.status(400).json({ error: `Mã SKU "${cleanSku}" đã được sử dụng bởi một sản phẩm khác. Vui lòng chọn mã SKU khác.` });
      }
  
      const updated = await db.update(dbProducts)
        .set({
          sku: cleanSku,
          name: product.name.trim(),
          category: product.category,
          subCategory: product.subCategory,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
          badge: product.badge || null,
          images: Array.isArray(product.images) ? product.images : [product.images || ""],
          description: product.description || "",
          colors: product.colors || [],
          sizes: product.sizes || ['S', 'M', 'L', 'XL'],
        })
        .where(eq(dbProducts.prodId, product.id))
        .returning();
  
      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm để cập nhật." });
      }
  
      res.json({ success: true, product: updated[0] });
    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm:", error);
      res.status(500).json({ error: "Không thể cập nhật sản phẩm." });
    }
  });
  
  // API: Admin Delete Product
  app.delete("/api/products/:prodId", async (req, res) => {
    const { prodId } = req.params;
    try {
      const deleted = await db.delete(dbProducts)
        .where(eq(dbProducts.prodId, prodId))
        .returning();
  
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm cần xóa." });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi xóa sản phẩm." });
    }
  });
  
  // API: Get Showrooms List from database
  app.get("/api/showrooms", async (req, res) => {
    try {
      const list = await db.select().from(dbShowrooms);
      const formatted = list.map(s => ({
        id: s.showroomId,
        name: s.name,
        province: s.province,
        district: s.district,
        address: s.address,
        phone: s.phone,
        hours: s.hours,
      }));
      res.json(formatted);
    } catch (error) {
      console.error("Lỗi truy vấn chi nhánh:", error);
      res.json(SHOWROOMS);
    }
  });
  
  // API: Validate Coupon Code
  app.post("/api/coupons/validate", async (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Vui lòng nhập mã giảm giá." });
    }
    try {
      const matched = await db.select().from(dbCoupons).where(eq(dbCoupons.code, code.trim().toUpperCase()));
      if (matched.length === 0) {
        return res.status(400).json({ error: "Mã giảm giá không tồn tại hoặc đã hết hạn." });
      }
      const coupon = matched[0];
      if (coupon.active !== 1) {
        return res.status(400).json({ error: "Mã giảm giá đã bị tạm ngừng áp dụng." });
      }
      res.json({
        code: coupon.code,
        discountType: coupon.discountType as 'percentage' | 'fixed',
        value: coupon.value,
        description: coupon.description,
      });
    } catch (error) {
      console.error("Lỗi kiểm tra mã giảm giá:", error);
      // Offline fallback
      const coupon = DISCOUNT_CODES.find(d => d.code.toUpperCase() === code.trim().toUpperCase());
      if (!coupon) {
        return res.status(400).json({ error: "Mã giảm giá không tồn tại." });
      }
      res.json(coupon);
    }
  });
  
  // API: Get all Coupons (Admin view)
  app.get("/api/coupons", async (req, res) => {
    try {
      const list = await db.select().from(dbCoupons).orderBy(desc(dbCoupons.createdAt));
      res.json(list);
    } catch (error) {
      console.error("Lỗi lấy danh sách coupon:", error);
      res.json(DISCOUNT_CODES);
    }
  });
  
  // API: Add Coupon (Admin operation)
  app.post("/api/coupons/add", async (req, res) => {
    const { coupon } = req.body;
    if (!coupon || !coupon.code || !coupon.value) {
      return res.status(400).json({ error: "Thiếu thông tin coupon bắt buộc." });
    }
    try {
      const [newCoupon] = await db.insert(dbCoupons).values({
        code: coupon.code.toUpperCase().trim(),
        discountType: coupon.discountType || 'percentage',
        value: Number(coupon.value),
        description: coupon.description || `Giảm ${coupon.value}% cho đơn hàng`,
        active: 1,
      }).returning();
      res.json({ success: true, coupon: newCoupon });
    } catch (error) {
      console.error("Lỗi thêm coupon:", error);
      res.status(500).json({ error: "Không thể thêm mã giảm giá." });
    }
  });
  
  // API: Delete Coupon (Admin operation)
  app.delete("/api/coupons/:code", async (req, res) => {
    const { code } = req.params;
    try {
      await db.delete(dbCoupons).where(eq(dbCoupons.code, code.toUpperCase()));
      res.json({ success: true });
    } catch (error) {
      console.error("Lỗi xóa coupon:", error);
      res.status(500).json({ error: "Lỗi khi xóa mã giảm giá." });
    }
  });
  
  // ==========================================
  // REVIEWS & WISHLIST APIs
  // ==========================================
  
  // API: Get product reviews
  app.get("/api/reviews", async (req, res) => {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ error: "Thiếu mã sản phẩm." });
    }
    try {
      const list = await db.select().from(dbReviews).where(eq(dbReviews.productId, productId as string)).orderBy(desc(dbReviews.createdAt));
      res.json(list);
    } catch (error) {
      console.error("Lỗi tải đánh giá sản phẩm:", error);
      res.json([]);
    }
  });
  
  // API: Add reviews
  app.post("/api/reviews", async (req, res) => {
    const { productId, userEmail, userName, rating, comment } = req.body;
    if (!productId || !userEmail || !rating || !comment) {
      return res.status(400).json({ error: "Thông tin đánh giá chưa hợp lệ." });
    }
    try {
      const [newReview] = await db.insert(dbReviews).values({
        productId,
        userEmail: userEmail.toLowerCase().trim(),
        userName: userName || userEmail.split("@")[0],
        rating: Number(rating),
        comment: comment.trim(),
      }).returning();
      res.json({ success: true, review: newReview });
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      res.status(500).json({ error: "Không thể lưu đánh giá của bạn lúc này." });
    }
  });
  
  // API: Get user wishlist
  app.get("/api/wishlist", async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Thiếu email." });
    }
    try {
      const list = await db.select().from(dbWishlist).where(eq(dbWishlist.userEmail, (email as string).toLowerCase().trim()));
      res.json(list.map(w => w.productId));
    } catch (error) {
      console.error("Lỗi tải yêu thích:", error);
      res.json([]);
    }
  });
  
  // API: Toggle wishlist item
  app.post("/api/wishlist/toggle", async (req, res) => {
    const { email, productId } = req.body;
    if (!email || !productId) {
      return res.status(400).json({ error: "Thiếu thông tin." });
    }
    try {
      const emailStr = email.toLowerCase().trim();
      const matched = await db.select().from(dbWishlist).where(
        and(
          eq(dbWishlist.userEmail, emailStr),
          eq(dbWishlist.productId, productId)
        )
      );
  
      if (matched.length > 0) {
        // Remove it
        await db.delete(dbWishlist).where(
          and(
            eq(dbWishlist.userEmail, emailStr),
            eq(dbWishlist.productId, productId)
          )
        );
        res.json({ success: true, status: "removed" });
      } else {
        // Add it
        await db.insert(dbWishlist).values({
          userEmail: emailStr,
          productId,
        });
        res.json({ success: true, status: "added" });
      }
    } catch (error) {
      console.error("Lỗi chuyển đổi yêu thích:", error);
      res.status(500).json({ error: "Không thể lưu cập nhật danh sách yêu thích." });
    }
  });
  
}
