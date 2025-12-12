import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import attendanceRoutes from "./routes/reports.js";
import managerRoutes from "./routes/managerRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
// import statsRoute from "./routes/Statistics.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


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


app.get("/", (req, res) => res.send("🚀 Attendance Management Backend is Running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
