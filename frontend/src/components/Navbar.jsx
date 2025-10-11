import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  if (location.pathname === "/" || location.pathname === "/login") return null;
  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isAdminOrManager = user.role === "admin" || user.role === "manager";

  return (
    <nav style={navStyle}>
      <Link to="/dashboard" style={logoStyle}>
        <img src={logo} alt="Logo" style={{ width: 44, height: 44 }} />
        <span>Bartons Builders Limited</span>
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
        <Link to="/reports" style={linkStyle}>
          Reports
        </Link>
        <Link to="/profile" style={linkStyle}>
          Profile
        </Link>
        <button onClick={handleLogout} style={logoutBtnStyle}>
          Logout
        </button>
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
  padding: "10px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "white",
};

const logoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  textDecoration: "none",
  color: "inherit",
};

const linkStyle = { color: "white", textDecoration: "none" };
const logoutBtnStyle = {
  background: "#e74c3c",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};

export default Navbar;
