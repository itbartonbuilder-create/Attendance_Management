import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";


import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Managers from "./pages/Managers";
import TaskPage from "./pages/TaskPage";
import Footer from "./components/Footer";
import VendorDashboard from "./pages/VendorDashboard";
import AdminBills from "./pages/AdminBills";
import ManagerBills from "./pages/ManagerBills";
import AdminVendors from "./pages/AdminVendors";
import Employees from "./pages/Employees";
import VendorBills from "./pages/VendorBills";
import VendorSubmitBill from "./pages/VendorSubmitBill";
import Stockmanagement from "./pages/Stockmanagement";
import AdminStockPage from "./pages/AdminStockPage";
import DailyReport from "./pages/DailyReport";
import ReportView from "./pages/ReportView";
import SiteExpense from "./pages/SiteExpense";
import LiveLocation from "./pages/LiveLocation";
import WorkCalendar from "./pages/WorkCalendar";
import Measurement from "./pages/Measurement";
import AdminMeasurements from "./pages/AdminMeasurements";
import CreateVoucher from "./pages/CreateVoucher";
import Requirement from "./pages/Requirement";
import AdminRequirementPage from "./pages/AdminRequirementPage";
import VendorMeasurement from "./pages/VendorMeasurement";
import WorkOrders from "./pages/WorkOrders";
import SupplierRate from "./pages/SupplierRate";


function AppLayout() {
  const location = useLocation();

  // Hide Navbar/Footer only when Measurement is opened in popup
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get("embed") === "true";

  return (
    <div className="app-container">
      {!isEmbed && <Navbar />}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workers" element={<Workers />} />
          {/* <Route path="/attendance" element={<Attendance />} /> */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/managers" element={<Managers />} />
          <Route path="/task" element={<TaskPage />} />
          <Route path="/task/:date" element={<TaskPage />} />
          <Route path="/stock" element={<Stockmanagement />} />
          <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          <Route path="/admin/bills" element={<AdminBills />} />
          <Route path="/manager/bills" element={<ManagerBills />} />
          <Route path="/vendors" element={<AdminVendors />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/vendor/bills" element={<VendorBills />} />
          <Route path="/vendor/submit-bill" element={<VendorSubmitBill />} />
          <Route path="/admin/stock" element={<AdminStockPage />} />
          <Route path="/daily-report/:date/:type" element={<DailyReport />} />
          <Route path="/attendance/:date" element={<Attendance />} />
          <Route path="/report-view/:date" element={<ReportView />} />
          <Route path="/site-expense" element={<SiteExpense />} />
          <Route path="/live-location" element={<LiveLocation />} />
          <Route path="/work-calendar" element={<WorkCalendar />} />
          <Route path="/measurement" element={<Measurement />} />
          <Route path="/admin-measurements" element={<AdminMeasurements />} />
          <Route path="/create-voucher" element={<CreateVoucher />} />
          <Route path="/requirement" element={<Requirement />} />
          <Route
            path="/admin/requirements"
            element={<AdminRequirementPage />}
          />
          <Route
            path="/vendor/measurement"
            element={<VendorMeasurement />}
          />
          <Route
            path="/vendor/measurement/work"
            element={<Measurement />}
          />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/supplier-rate" element={<SupplierRate />}/>
        </Routes>
      </div>

      {!isEmbed && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
