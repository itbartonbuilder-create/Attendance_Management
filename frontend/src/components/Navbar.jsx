import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, [location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (location.pathname === "/" || location.pathname === "/login") return null;
  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const { role } = user;

  return (
    <nav className="navbar" style={navStyle}>
    
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-logo" style={logoStyle}>
          <img src={logo} alt="Bartons Builders Limited" style={{ width: 44, height: 44 }} />
          <span style={{ marginLeft: 8 }}>Bartons Builders Limited</span>
        </Link>
      </div>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          ...menuButtonStyle,
          display: window.innerWidth <= 768 ? "block" : "none",
        }}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div
        className={`navbar-links ${menuOpen ? "active" : ""}`}
        style={{
          ...linkContainerStyle,
          ...(window.innerWidth <= 768
            ? {
                display: menuOpen ? "flex" : "none",
                flexDirection: "column",
                background: "#2C3E50",
                position: "absolute",
                top: "74px",
                left: 0,
                width: "100%",
                padding: "10px 0",
              }
            : {
                display: "flex",
                flexDirection: "row",
                position: "static",
              }),
        }}
      >
       
        {role === "admin" && (
          <>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/workers" style={linkStyle}>Workers</Link>
            <Link to="/attendance" style={linkStyle}>Attendance</Link>
            <Link to="/managers" style={linkStyle}>Managers</Link>
            <Link to="/reports" style={linkStyle}>Reports</Link>
             <Link to="/task" style={linkStyle}>Task</Link>
             <Link to="/admin/bills" style={linkStyle}>Bills</Link>
                <Link to="/vendors" style={linkStyle}>Vendors</Link>
            <Link to="/profile" style={linkStyle}>Profile</Link>
          </>
        )}

        {role === "manager" && (
          <>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/workers" style={linkStyle}>Workers</Link>
            <Link to="/attendance" style={linkStyle}>Attendance</Link>
            <Link to="/reports" style={linkStyle}>Reports</Link>
             <Link to="/task" style={linkStyle}>Task</Link>
              <Link to="/manager/bills" style={linkStyle}>Bills</Link>
            <Link to="/profile" style={linkStyle}>Profile</Link>
          </>
        )}

        {role === "worker" && (
          <>
            <Link to="/reports" style={linkStyle}>Reports</Link>
             <Link to="/task" style={linkStyle}>Task</Link>
            <Link to="/profile" style={linkStyle}>Profile</Link>
          </>
        )}
        {role === "vendor" && (
  <Link to="/vendor-dashboard" style={linkStyle}>
    Submit Bill
  </Link>
)}

        <button onClick={handleLogout} style={logoutStyle}>Logout</button>
      </div>
    </nav>
  );
}


const navStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  zIndex: 1000,
  background: "#2C3E50",
  padding: "24px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "white",
};

const logoStyle = {
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  color: "white",
  fontWeight: "bold",
};

const linkContainerStyle = {
  gap: 16,
  alignItems: "center",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontWeight: 500,
  padding: "6px 8px",
};

const logoutStyle = {
  background: "#e74c3c",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const menuButtonStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: 24,
  cursor: "pointer",
};

export default Navbar;
