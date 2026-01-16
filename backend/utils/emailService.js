import dotenv from "dotenv";
dotenv.config(); 

import nodemailer from "nodemailer";

console.log("📧 Initializing Email Service...");
console.log("EMAIL_USER in service:", process.env.EMAIL_USER);

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Email server error:", error);
  } else {
    console.log("✅ Email server is ready");
  }
});

export const sendPendingMail = async (toEmail, vendorName) => {
  return transporter.sendMail({
    from: `"Attendance System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "⏳ Vendor Approval Pending",
    html: `<p>Hello ${vendorName},</p>
           <p>Your account is pending admin approval.</p>`,
  });
};

export const sendApprovalMail = async (toEmail, vendorName) => {
  return transporter.sendMail({
    from: `"Attendance System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "✅ Vendor Approved",
    html: `<p>Hello ${vendorName},</p>
           <p>Your vendor account has been approved.</p>`,
  });
};
