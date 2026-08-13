import type { Express } from "express";
import { db, orders as dbOrders } from "../../db/index.ts";
import { desc, eq } from "drizzle-orm";

export function registerOrderRoutes(app: Express) {
  // Create Order
  app.post("/api/orders", async (req, res) => {
    const { order } = req.body;
    if (!order || !order.id || !order.customerName || !order.customerPhone) {
      return res.status(400).json({ error: "Thông tin đơn hàng không hợp lệ." });
    }
  
    try {
      const [newDbOrder] = await db.insert(dbOrders)
        .values({
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail || null,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalAmount,
          items: order.items,
          status: order.status || "Đang xử lý",
        })
        .returning();
  
      res.json({ success: true, order: newDbOrder });
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error);
      res.status(500).json({ error: "Không thể lưu đơn hàng." });
    }
  });
  
  // Get Order History
  app.get("/api/orders", async (req, res) => {
    const { email } = req.query;
    try {
      let results;
      if (email) {
        results = await db.select()
          .from(dbOrders)
          .where(eq(dbOrders.customerEmail, (email as string).toLowerCase().trim()))
          .orderBy(desc(dbOrders.createdAt));
      } else {
        results = await db.select()
          .from(dbOrders)
          .orderBy(desc(dbOrders.createdAt));
      }
  
      // Map DB results to OrderHistory format for client
      const formattedOrders = results.map(o => ({
        id: o.orderId,
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "",
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        items: o.items,
        status: o.status,
      }));
  
      res.json(formattedOrders);
    } catch (error) {
      console.error("Lỗi lấy lịch sử đơn hàng:", error);
      res.status(500).json({ error: "Không thể tải danh sách đơn hàng." });
    }
  });
  
  // Admin Update Order Status
  app.post("/api/orders/update-status", async (req, res) => {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: "Thiếu mã đơn hàng hoặc trạng thái mới." });
    }
  
    try {
      const updated = await db.update(dbOrders)
        .set({ status })
        .where(eq(dbOrders.orderId, orderId))
        .returning();
  
      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy đơn hàng để cập nhật." });
      }
  
      res.json({ success: true, order: updated[0] });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi cập nhật trạng thái đơn hàng." });
    }
  });
  
  // Admin Delete Order
  app.delete("/api/orders/:orderId", async (req, res) => {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: "Thiếu mã đơn hàng." });
    }
  
    try {
      const deleted = await db.delete(dbOrders)
        .where(eq(dbOrders.orderId, orderId))
        .returning();
  
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy đơn hàng để xóa." });
      }
  
      res.json({ success: true, message: "Xóa đơn hàng thành công." });
    } catch (error) {
      console.error("Lỗi xóa đơn hàng:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi xóa đơn hàng." });
    }
  });
  
}
