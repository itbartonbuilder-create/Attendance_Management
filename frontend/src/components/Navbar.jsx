import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

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
        to="/"
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
        <Link to="/dashboard" style={linkStyle}>
          Dashboard
        </Link>
        <Link to="/workers" style={linkStyle}>
          Workers
        </Link>
        <Link to="/attendance" style={linkStyle}>
          Attendance
        </Link>
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
