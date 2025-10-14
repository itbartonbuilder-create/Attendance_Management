import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIX: reload user every time route changes (especially after login)
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [location.pathname]);

  // Hide navbar completely on login page or root
  if (location.pathname === "/" || location.pathname === "/login") return null;

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isAdminOrManager = user.role === "admin" || user.role === "manager";

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-logo">
          <img src={logo} alt="Bartons Builders Limited" />
          <span>Bartons Builders Limited</span>
        </Link>
      </div>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
        {isAdminOrManager && (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/workers" className="nav-link">
              Workers
            </Link>
            <Link to="/attendance" className="nav-link">
              Attendance
            </Link>
          </>
        )}
       
        <Link to="/reports" className="nav-link">
          Reports
        </Link>
        <Link to="/profile" className="nav-link">
          Profile
        </Link>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
