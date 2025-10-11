import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import loginPage from "../assets/loginPage.jpeg";

function Login() {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      let res;

      if (role === "admin" || role === "manager") {
        res = await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
          { email, password }
        );
      }

      else {
        res = await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
          { name, contactNo }
        );
      }

      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert(`✅ Login Successful — Welcome ${res.data.user.name || "User"}`);

      if (res.data.user.role === "admin") navigate("/dashboard");
      else if (res.data.user.role === "manager") navigate("/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "❌ Login failed. Please try again.");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${loginPage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="login-box"
        style={{
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          
        }}
      >
   
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <img
            src={logo}
            alt="Bartons Builders Limited logo"
            style={{
              width: 44,
              height: 55,
              objectFit: "contain",
              borderRadius: 6,
              background: "transparent",
            }}
          />
          <h1
            style={{
            
              fontWeight: "bold",
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              margin: 0,
            }}
          >
            Bartons Builders Limited
          </h1>
        </div>

        {/* selection */}
        <div className="role-selection" style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "15px" }}>
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === "admin"}
              onChange={(e) => setRole(e.target.value)}
            />{" "}
            Admin
          </label>

          <label style={{ marginRight: "15px" }}>
            <input
              type="radio"
              name="role"
              value="manager"
              checked={role === "manager"}
              onChange={(e) => setRole(e.target.value)}
            />{" "}
            Manager
          </label>

          <label style={{ marginRight: "15px" }}>
            <input
              type="radio"
              name="role"
              value="worker"
              checked={role === "worker"}
              onChange={(e) => setRole(e.target.value)}
            />{" "}
            Worker
          </label>
        </div>
        <form onSubmit={handleLogin}>
          {(role === "admin" || role === "manager") && (
            <>
              <input
                type="email"
                placeholder={`Enter ${role} Email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "18px",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#fff",
                    userSelect: "none",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </>
          )}

          {role === "worker" && (
            <>
              <input
                type="text"
                placeholder="Enter Worker Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
<div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Enter Contact Number"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                required
                style={inputStyle}
              />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "18px",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#fff",
                    userSelect: "none",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
                </div>y
            </>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "15px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#007bff",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = "#0056b3")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = "#007bff")
            }
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "93%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.3)",
  backgroundColor: "black",
  color: "white",
  outline: "none",
  fontSize: "17px",
};

export default Login;
