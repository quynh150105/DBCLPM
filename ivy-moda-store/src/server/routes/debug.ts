import type { Express } from "express";
import { maskSecret, transporter } from "../mail.ts";

export function registerDebugRoutes(app: Express) {
  // API: Diagnostic SMTP connection
  app.get("/api/debug/test-smtp", async (req, res) => {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = process.env.SMTP_PORT || "587";
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const smtpFrom = process.env.SMTP_FROM || "";
  
    const debugInfo = {
      SMTP_HOST: smtpHost,
      SMTP_PORT: smtpPort,
      SMTP_USER: maskSecret(smtpUser),
      SMTP_PASS: maskSecret(smtpPass),
      SMTP_FROM: smtpFrom || "Chưa đặt (Mặc định dùng " + (smtpUser || "no-reply@ivy.com") + ")",
    };
  
    try {
      if (!smtpUser || !smtpPass) {
        return res.json({
          success: false,
          status: "MISCONFIGURED",
          message: "Thiếu biến môi trường SMTP_USER hoặc SMTP_PASS. Vui lòng thiết lập trong Cài đặt (Settings) của AI Studio.",
          debugInfo
        });
      }
  
      // Verify SMTP connection
      await transporter.verify();
  
      return res.json({
        success: true,
        status: "CONNECTED",
        message: "Kết nối đến máy chủ mail thành công! Transporter đã sẵn sàng gửi email.",
        debugInfo
      });
    } catch (error: any) {
      console.error("[SMTP DEBUG ERROR]:", error);
      return res.json({
        success: false,
        status: "CONNECTION_FAILED",
        message: "Không thể kết nối đến máy chủ mail.",
        error: error.message || error.toString(),
        code: error.code || "UNKNOWN",
        debugInfo
      });
    }
  });
  
}
