import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // current path check ke liye

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Hide navbar on login page
  if (location.pathname === "/" || location.pathname === "/login") return null;
  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isAdminOrManager = user.role === "admin" || user.role === "manager";
  const isWorker = user.role === "worker";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        background: "#2C3E50",
        padding: "10px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        boxSizing: "border-box",
      }}
    >
      <Link
        to="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <img
          src={logo}
          alt="Bartons Builders Limited logo"
          style={{
            width: 44,
            height: 44,
            objectFit: "contain",
            borderRadius: 6,
            background: "transparent",
          }}
        />
        <span
          style={{
            margin: 8,
            color: "#f39c12",
            fontWeight: 700,
            fontSize: 24,
          }}
        >
          Bartons Builders Limited
        </span>
      </Link>

      <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
        {isAdminOrManager && (
          <>
            <Link to="/dashboard" style={linkStyle}>
              Dashboard
            </Link>
            <Link to="/workers" style={linkStyle}>
              Workers
            </Link>
            <Link to="/attendance" style={linkStyle}>
              Attendance
            </Link>
          </>
        )}

        {isWorker && (
          <Link to="/dashboard" style={linkStyle}>
            Dashboard
          </Link>
        )}

        {/* Reports & Profile always visible */}
        <Link to="/reports" style={linkStyle}>
          Reports
        </Link>
        <Link to="/profile" style={linkStyle}>
          Profile
        </Link>

        <button
          onClick={handleLogout}
          style={{
            background: "#e74c3c",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontWeight: 500,
  padding: "6px 8px",
};

export default Navbar;
