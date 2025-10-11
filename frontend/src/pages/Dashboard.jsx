import React, { useEffect, useState } from "react";
import axios from "axios";
import dashboardImg from "../assets/dashboard.jpg";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [allWorkers, setAllWorkers] = useState([]);
  const [totalSites, setTotalSites] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      if (parsedUser.role === "admin" || parsedUser.role === "manager") {
        fetchAllWorkers();
      }
    }
  }, []);

  const fetchAllWorkers = async () => {
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/workers"
      );
      setAllWorkers(res.data);

      const uniqueSites = [...new Set(res.data.map((w) => w.site))];
      setTotalSites(uniqueSites.length);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  if (!user) return <h2>❌ Not Authorized</h2>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard</h1>
        <div className="user-info">
          <span>{user.name}</span>
          <span className="role">({user.role})</span>
        </div>
      </header>

      <div className="dashboard-hero">
        <img src={dashboardImg} alt="dashboard" className="dashboard-image" />
        <div className="overlay">
          <h2>
            Welcome, {user.name} 👋
          </h2>
          <p>
            {user.role === "worker"
              ? "Welcome to your dashboard — check reports or profile."
              : "Manage your team and site operations efficiently."}
          </p>
        </div>
      </div>

      {user.role !== "worker" && (
        <section className="stats-section">
          <div className="stat-card blue">
            <h3>Total Workers</h3>
            <p>{allWorkers.length}</p>
          </div>
          <div className="stat-card green">
            <h3>Total Sites</h3>
            <p>{totalSites}</p>
          </div>
          <div className="stat-card red">
            <h3>Productivity Index</h3>
            <p>95%</p>
          </div>
        </section>
      )}

      {user.role === "worker" && (
        <section className="stats-section">
          <div className="stat-card blue">
            <h3>Current Site</h3>
            <p>{user.site || "Not Assigned"}</p>
          </div>
          <div className="stat-card green">
            <h3>Role</h3>
            <p>{user.role}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
