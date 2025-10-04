import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Login Successful");

        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") navigate("/dashboard");
        else if (data.user.role === "manager") navigate("/dashboard");
        else if (data.user.role === "worker") navigate("/dashboard");
        else navigate("/dashboard");
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert("❌ Error in login");
    }
  };

  return (
    <div  className="login-container">
      <h2>👷 Construction Site Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          Don’t have an account? <a href="/register">Register</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
