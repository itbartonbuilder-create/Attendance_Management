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

// =====================================
// ⏳ Vendor Pending Approval Email
// =====================================
export const sendPendingMail = async (toEmail, vendorName) => {
  const msg = {
    to: toEmail,
    from: {
      email: process.env.EMAIL_USER, // VERIFIED SENDGRID SENDER
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
        <p>
          Regards,<br/>
          <strong>Bartons Builders </strong>
        </p>
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
// ✅ Vendor Approved Email (WITH CODE)
// =====================================
export const sendApprovalMail = async (
  toEmail,
  vendorName,
  vendorCode
) => {
  const msg = {
    to: toEmail,
    from: {
      email: process.env.EMAIL_USER, // VERIFIED SENDGRID SENDER
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

        <p style="margin-top:10px;">
          <strong>Your Vendor Code:</strong><br/>
          <span style="
            font-size:20px;
            color:#2e7d32;
            font-weight:bold;
          ">
            ${vendorCode}
          </span>
        </p>

        <p>
          Please use this Vendor Code for all future communication.
        </p>

        <br/>
        <p>
          Regards,<br/>
          <strong>Bartons Builders Attendance System</strong>
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(
      "✅ Approval email sent to:",
      toEmail,
      "Vendor Code:",
      vendorCode
    );
  } catch (error) {
    console.error(
      "❌ SendGrid Approval Mail Error:",
      error.response?.body || error
    );
    throw error;
  }
};
