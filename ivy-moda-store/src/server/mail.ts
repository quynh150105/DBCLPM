import nodemailer from "nodemailer";

// ==========================================
// MAIL SERVER SMTP CONFIGURATION & HELPER
// ==========================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const fromEmail = process.env.SMTP_FROM || `"IVY moda" <${process.env.SMTP_USER || "no-reply@ivy.com"}>`;
  const mailOptions = {
    from: fromEmail,
    to,
    subject,
    html,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("=========================================");
      console.log(`[SMTP SIMULATION] To: ${to}`);
      console.log(`[SMTP SIMULATION] Subject: ${subject}`);
      console.log(`[SMTP SIMULATION] Content OTP/Credentials (No SMTP Configured):`);
      console.log(html.replace(/<[^>]*>/g, '').trim().substring(0, 500) + "...");
      console.log("=========================================");
      return { messageId: "simulated_" + Date.now() };
    }
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent to ${to} successfully: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("[SMTP ERROR] SMTP sending failed:", err);
    console.log(`[SMTP FALLBACK] Simulated sending email to ${to}`);
    return { messageId: "fallback_" + Date.now() };
  }
}

// Helper to mask secrets in debug API
function maskSecret(str: string | undefined): string {
  if (!str) return "EMPTY";
  if (str.length <= 4) return "****";
  return str.substring(0, 2) + "..." + str.substring(str.length - 2);
}

export { transporter, sendEmail, maskSecret };
