import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

const run = async () => {
  await connectDB();
  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log("Admin exists:", existing.email);
    process.exit(0);
  }
  const hash = await bcrypt.hash("Admin@123", 10);
  const admin = await User.create({ name: "Super Admin", email: "admin@example.com", password: hash, role: "admin" });
  console.log("Admin created =>", admin.email, "Password: Admin@123");
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
