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
  const [name, setName] = useState(""); // Worker or Manager site/name
  const [contactNo, setContactNo] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let res;

      if (role === "admin") {
        res = await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
          { email, password }
        );
      } else if (role === "manager") {
        res = await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
          { site: name, contactNo }
        );
      } else {
        res = await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
          { name, contactNo }
        );
      }

      const userData = {
        ...res.data.user,
        displayName: res.data.user.name || res.data.user.site || "User",
      };

      localStorage.setItem("user", JSON.stringify(userData));

      alert(`✅ Login Successful — Welcome ${userData.displayName}`);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "❌ Login failed. Please try again.");
    }
  };

  return (
    <div
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
        style={{
          backdropFilter: "blur(30px)",
          borderRadius: "16px",
          padding: "30px",
          width: "350px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <img src={logo} alt="Logo" style={{ width: 44, height: 55, objectFit: "contain" }} />
          <h1
            style={{
              fontWeight: "bold",
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              margin: 0,
              fontSize: "25px",
            }}
          >
            Bartons Builders Limited
          </h1>
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: "20px", textAlign: "center", color: "white" }}>
          <label style={{ marginRight: "15px" }}>
            <input type="radio" name="role" value="admin" checked={role === "admin"} 
              onChange={(e) => setRole(e.target.value)} /> Admin
          </label>
          <label style={{ marginRight: "15px" }}>
            <input type="radio" name="role" value="manager" checked={role === "manager"} 
              onChange={(e) => setRole(e.target.value)} /> Manager
          </label>
          <label>
            <input type="radio" name="role" value="worker" checked={role === "worker"}
              onChange={(e) => setRole(e.target.value)} /> Worker
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Admin */}
          {role === "admin" && (
            <>
              <input type="email" placeholder="Enter Admin Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} placeholder="Enter Password" value={password} 
                  onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
                <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>{showPassword ? "🙈" : "👁️"}</span>
              </div>
            </>
          )}

          {/* Manager */}
          {role === "manager" && (
            <>
              <select value={name}
                onChange={(e) => setName(e.target.value)} 
                required style={{ ...inputStyle, width: "100%", color: name ? "white" : "gray" }}>
                <option value="">Select Site</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Japuriya">Japuriya</option>
                <option value="Vashali">Vashali</option>
                <option value="Faridabad">Faridabad</option>
              </select>
              <div style={{ position: "relative" }}>
                <input type="text" placeholder="Enter Contact Number" value={contactNo} 
                  onChange={(e) => setContactNo(e.target.value)} required style={inputStyle} />
                 <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>{showPassword ? "🙈" : "👁️"}</span>
              </div>
            </>
          )}

          {/* Worker */}
          {role === "worker" && (
            <>
              <input type="text" placeholder="Enter Worker Name" value={name} 
                onChange={(e) => setName(e.target.value)} required style={inputStyle} />
              <div style={{ position: "relative" }}>
                <input type="text" placeholder="Enter Contact Number" value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)} required style={inputStyle} />
                 <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>{showPassword ? "🙈" : "👁️"}</span>
              </div>
            </>
          )}

          <button type="submit" style={buttonStyle}>Login</button>
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

const eyeStyle = {
  position: "absolute",
  right: "12px",
  top: "18px",
  cursor: "pointer",
  fontSize: "18px",
  color: "#fff",
  userSelect: "none",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "15px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#007bff",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Login;
