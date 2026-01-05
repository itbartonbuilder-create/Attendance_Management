import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Router>
      <div className="app-container">
      <Navbar />
         <div className="main-content">
      <Routes>
       <Route path="/" element={<Login />} /> 
        
     
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/managers" element={<Managers />} />
        <Route path="/task" element={<TaskPage />} />
        <Route path="/vendor-dashboard" element={<VendorDashboard />} />
        <Route path="/admin/bills" element={<AdminBills />} />
        <Route path="/vendors" element={<AdminVendors />} />
<Route path="/manager/bills" element={<ManagerBills />} />
        <Route path="/employees" element={<Employees />} />
      </Routes>
            </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
