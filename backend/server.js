import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import attendanceRoutes from "./routes/reports.js";
import managerRoutes from "./routes/managerRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import BillRoutes from "./routes/BillRoutes.js"
import adminRoutes from "./routes/adminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
// import statsRoute from "./routes/Statistics.js";
import stockRoutes from "./routes/stockRoutes.js";
import dailyReportRoutes from "./routes/dailyReportRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 REQUIRED FOR ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 MAKE UPLOADS PUBLIC (FIX)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


await connectDB();

app.use("/api/auth", (await import("./routes/authRoutes.js")).default);
app.use("/api/workers", (await import("./routes/workerRoutes.js")).default);
app.use("/api/attendance", (await import("./routes/attendanceRoutes.js")).default);
import reportsRoutes from "./routes/reports.js";
app.use("/api/attendance/reports", reportsRoutes);
// app.use("/api/attendance", statsRoute);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/bill", BillRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api", dailyReportRoutes);




app.get("/", (req, res) => res.send("🚀 Attendance Management Backend is Running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
