import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) return null; 

  const handleLogout = () => {
    localStorage.removeItem("user"); 
    setUser(null);
    navigate("/"); 
  };

  return (
    <nav
      style={{position: "fixed",         
        top: 0,
        left: 0,
        width: "100%",
         zIndex: 1000, 
        background: "#2C3E50",
        padding: "12px 0px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
      }}
    >
      <h2 style={{ margin: 0, color: "#f39c12" }}>🏗️ Attendance System</h2>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
       
        {(user.role === "admin" || user.role === "manager") && (
          <Link to="/dashboard" style={linkStyle}>
            Dashboard
          </Link>
        )}

        {(user.role === "admin" || user.role === "manager") && (
          <Link to="/workers" style={linkStyle}>
            Workers
          </Link>
        )}
  {(user.role === "admin" || user.role === "manager") && (
          <Link to="/attendance" style={linkStyle}>
            Attendance
          </Link>
        )}

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
            padding: "6px 12px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "500",
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
  fontWeight: "500",
};

export default Navbar;
