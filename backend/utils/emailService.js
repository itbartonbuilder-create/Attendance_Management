import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPendingMail = async (email, name) => {
  await transporter.sendMail({
    from: `"Bartons Builders" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Vendor Registration Received",
    html: `
      <h3>Hello ${name},</h3>
      <p>Thank you for registering as a vendor.</p>
      <p>Your approval is <b>pending</b>.</p>
      <p>You will receive another email once approved.</p>
    `,
  });
};

export const sendApprovalMail = async (email, name, vendorCode) => {
  await transporter.sendMail({
    from: `"Bartons Builders" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Vendor Approved 🎉",
    html: `
      <h3>Congratulations ${name},</h3>
      <p>Your vendor account has been approved.</p>
      <h2>Vendor Code: ${vendorCode}</h2>
      <p>You can now login.</p>
    `,
  });
};
