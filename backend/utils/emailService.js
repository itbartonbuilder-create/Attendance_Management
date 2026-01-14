import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= PENDING MAIL =================
export const sendPendingMail = async (toEmail, name) => {
  await transporter.sendMail({
    from: `"Bartons Builders" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Vendor Registration Pending Approval",
    html: `
      <h2>Hello ${name}</h2>
      <p>Your vendor registration has been <b>successfully submitted</b>.</p>
      <p>Status: <b style="color:orange">Pending Admin Approval</b></p>
      <p>You will receive another email once approved.</p>
      <br/>
      <p>– Bartons Builders Limited</p>
    `,
  });
};

// ================= APPROVAL MAIL =================
export const sendApprovalMail = async (toEmail, name, vendorCode) => {
  await transporter.sendMail({
    from: `"Bartons Builders" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Vendor Approved Successfully 🎉",
    html: `
      <h2>Congratulations ${name} 🎉</h2>
      <p>Your vendor account has been <b style="color:green">APPROVED</b>.</p>
      <p><b>Your Vendor Code:</b> ${vendorCode}</p>
      <p>You can now login and start using the system.</p>
      <br/>
      <p>– Bartons Builders Limited</p>
    `,
  });
};
