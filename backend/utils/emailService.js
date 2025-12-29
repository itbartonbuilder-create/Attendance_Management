import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify only in production (optional)
if (process.env.NODE_ENV === "production") {
  transporter.verify((error, success) => {
    if (error) {
      console.log("❌ Email config error:", error);
    } else {
      console.log("✅ Email server ready");
    }
  });
}

// ================== PENDING MAIL ==================
export const sendPendingMail = async (toEmail, name) => {
  await transporter.sendMail({
    from: `"Attendance App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Vendor Registration Pending",
    html: `
      <h2>Hello ${name}</h2>
      <p>Your vendor registration is <b>pending approval</b>.</p>
      <p>We will notify you once approved.</p>
    `,
  });
};

// ================== APPROVAL MAIL ==================
export const sendApprovalMail = async (toEmail, name) => {
  await transporter.sendMail({
    from: `"Attendance App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Vendor Registration Approved",
    html: `
      <h2>Congratulations ${name} 🎉</h2>
      <p>Your vendor account has been <b>approved</b>.</p>
      <p>You can now login.</p>
    `,
  });
};
