import dotenv from "dotenv";
dotenv.config();

import sgMail from "@sendgrid/mail";

console.log("📧 Initializing SendGrid Email Service...");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "MISSING");
console.log(
  "SENDGRID_API_KEY:",
  process.env.SENDGRID_API_KEY ? "SET" : "MISSING"
);


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendPendingMail = async (toEmail, vendorName) => {
  const msg = {
    to: toEmail,
    from: {
      email: process.env.EMAIL_USER, // verified sender email
      name: "Bartons Builders Attendance System",
    },
    subject: "⏳ Vendor Approval Pending",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <p>Hello <strong>${vendorName}</strong>,</p>

        <p>
          Your vendor account has been created successfully and is currently
          <strong>pending admin approval</strong>.
        </p>

        <p>
          You will receive another email once your account is approved.
        </p>

        <br/>
        <p>Regards,<br/>
        <strong>Bartons Builders Attendance System</strong></p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Pending approval email sent to:", toEmail);
  } catch (error) {
    console.error(
      "❌ SendGrid Pending Mail Error:",
      error.response?.body || error
    );
    throw error;
  }
};

// =====================================
// ✅ Vendor Approved Email
// =====================================
export const sendApprovalMail = async (toEmail, vendorName) => {
  const msg = {
    to: toEmail,
    from: {
      email: process.env.EMAIL_USER, // verified sender email
      name: "Bartons Builders Attendance System",
    },
    subject: "✅ Vendor Account Approved",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <p>Hello <strong>${vendorName}</strong>,</p>

        <p>
          🎉 Your vendor account has been
          <strong>approved successfully</strong>.
        </p>

        <p>
          You can now log in and start using the Attendance Management System.
        </p>

        <br/>
        <p>Regards,<br/>
        <strong>Bartons Builders Attendance System</strong></p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Approval email sent to:", toEmail);
  } catch (error) {
    console.error(
      "❌ SendGrid Approval Mail Error:",
      error.response?.body || error
    );
    throw error;
  }
};
