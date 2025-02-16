import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Gmail dùng TLS, không dùng SSL
    auth: {
      user: process.env.EMAIL_USER || "2254810193@vaa.edu.vn",
      pass: process.env.EMAIL_PASS || "njtl yzxy umqh cynq",
    },
    tls: {
      rejectUnauthorized: false, // Giúp tránh lỗi chứng chỉ tự ký
    },
});


export const sendMail = async ({ email, subject, html }) => {
    try {
        const info = await transporter.sendMail({
          from: `"SECONDBOOKING" <${process.env.EMAIL_USER}>`,
          to: email,
          subject,
          html,
        });
    
        console.log("Email sent: ", info.messageId);
        return info;
      } catch (err) {
        console.error("Email sending error:", err);
        throw new Error("Failed to send email");
      }
    };

