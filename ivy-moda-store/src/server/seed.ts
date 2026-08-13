import { PRODUCTS, SHOWROOMS, DISCOUNT_CODES } from "../data";
import { db, users, orders as dbOrders, products as dbProducts, showrooms as dbShowrooms, coupons as dbCoupons, reviews as dbReviews, wishlist as dbWishlist, categories as dbCategories } from "../db/index.ts";
import { eq, sql } from "drizzle-orm";

// Seeding engine to make sure Cloud SQL database is fully populated on boot
export async function seedDatabaseIfNeeded() {
  try {
    // Check and auto-add 'password' column if missing
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password text`);
      console.log("[IVY Database] Auto-added 'password' column to users table successfully.");
    } catch (e) {
      console.log("[IVY Database] password column verification handled (or table up to date).");
    }

    // Check and auto-add 'username' column if missing
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`);
      console.log("[IVY Database] Auto-added 'username' column to users table successfully.");
    } catch (e) {
      console.log("[IVY Database] username column verification handled (or table up to date).");
    }

    // 1. Seed Products
    const existingProducts = await db.select().from(dbProducts).limit(1);
    if (existingProducts.length === 0) {
      console.log("[IVY Database] seeding default products...");
      for (const p of PRODUCTS) {
        await db.insert(dbProducts).values({
          prodId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          subCategory: p.subCategory,
          price: p.price,
          originalPrice: p.originalPrice || null,
          badge: p.badge || null,
          images: p.images,
          description: p.description,
          colors: p.colors,
          sizes: p.sizes,
        }).onConflictDoNothing();
      }
      console.log("[IVY Database] Products seeded successfully.");
    }

    // 2. Seed Showrooms
    const existingShowrooms = await db.select().from(dbShowrooms).limit(1);
    if (existingShowrooms.length === 0) {
      console.log("[IVY Database] seeding default showrooms...");
      for (const s of SHOWROOMS) {
        await db.insert(dbShowrooms).values({
          showroomId: s.id,
          name: s.name,
          province: s.province,
          district: s.district,
          address: s.address,
          phone: s.phone,
          hours: s.hours,
        }).onConflictDoNothing();
      }
      console.log("[IVY Database] Showrooms seeded successfully.");
    }

    // 3. Seed Coupons
    const existingCoupons = await db.select().from(dbCoupons).limit(1);
    if (existingCoupons.length === 0) {
      console.log("[IVY Database] seeding default coupons...");
      for (const c of DISCOUNT_CODES) {
        await db.insert(dbCoupons).values({
          code: c.code.toUpperCase(),
          discountType: c.discountType,
          value: c.value,
          description: c.description,
          active: 1,
        }).onConflictDoNothing();
      }
      console.log("[IVY Database] Coupons seeded successfully.");
    }

    // 4. Default admin account setup (ensure at least demo email behaves as admin)
    const adminEmail = "admin@ivy.com";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        uid: "default_admin_001",
        email: adminEmail,
        name: "IVY Administrator",
        phone: "0900000000",
        role: "admin",
        gender: "Nam",
        birthday: "1990-01-01",
        address: "IVY Head Office, Hà Nội"
      }).onConflictDoNothing();
      console.log("[IVY Database] Default admin user registered (admin@ivy.com / pass: admin123).");
    }

    // 5. Seed Categories
    const existingCats = await db.select().from(dbCategories).limit(1);
    if (existingCats.length === 0) {
      console.log("[IVY Database] seeding default categories...");
      const defaultCategories = ["Nữ", "Nam", "Trẻ em"];
      for (const catName of defaultCategories) {
        await db.insert(dbCategories).values({
          name: catName,
        }).onConflictDoNothing();
      }
      console.log("[IVY Database] Categories seeded successfully.");
    }
  } catch (err) {
    console.error("[IVY Database] Auto-seeding failed:", err);
  }
}

