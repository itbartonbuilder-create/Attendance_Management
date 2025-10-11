import React, { useEffect, useState } from "react";
import axios from "axios";
import dashboard from "../assets/dashboard.jpg";
import "../App.css";


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
      
      const res = await axios.get("https://attendance-management-backend-vh2w.onrender.com/api/workers");
      setAllWorkers(res.data);

      const uniqueSites = [...new Set(res.data.map((w) => w.site))];
      setTotalSites(uniqueSites.length);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  if (!user) return <h2>❌ Not Authorized</h2>;


  if (user.role === "admin") {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>{user.name}</span>
            <span className="role">({user.role})</span>
          </div>
        </header>

        <div className="dashboard-hero">
          <img src={dashboard} alt="dashboard" className="dashboard-image" />
          <div className="overlay">
            <h2>Welcome, {user.name} 👋</h2>
            <p>Manage your entire workforce and site operations efficiently</p>
          </div>
        </div>

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

        <section className="table-section">
          <h2>👷 All Workers Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role Type</th>
                <th>Sub Role</th>
                <th>Site</th>
                <th>Contact</th>
                <th>Salary/Day</th>
              </tr>
            </thead>
            <tbody>
              {allWorkers.map((worker, index) => (
                <tr key={index}>
                  <td>{worker.name}</td>
                  <td>{worker.roleType}</td>
                  <td>{worker.role}</td>
                  <td>{worker.site}</td>
                  <td>{worker.contactNo}</td>
                  <td>₹{worker.perDaySalary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }


  if (user.role === "manager") {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Manager Dashboard</h1>
          <div className="user-info">
            <span>{user.name}</span>
            <span className="role">({user.role})</span>
          </div>
        </header>

        <div className="dashboard-hero">
          <img src={dashboard} alt="dashboard" className="dashboard-image" />
          <div className="overlay">
            <h2>Welcome back, {user.name} 👋</h2>
            <p>Here’s an overview of your team and projects</p>
          </div>
        </div>

        <section className="stats-section">
          <div className="stat-card blue">
            <h3>Total Workers</h3>
            <p>{allWorkers.length}</p>
          </div>
          <div className="stat-card green">
            <h3>Active Projects</h3>
            <p>4</p>
          </div>
          <div className="stat-card red">
            <h3>Team Efficiency</h3>
            <p>95%</p>
          </div>
        </section>

        <section className="table-section">
          <h2>👷 Workers Overview</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              {allWorkers.map((worker, index) => (
                <tr key={index}>
                  <td>{worker.name}</td>
                  <td>{worker.role}</td>
                  <td>{worker.site}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  if (user.role === "worker") {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Worker Dashboard</h1>
          <div className="user-info">
            <span>{user.name}</span>
            <span className="role">({user.role})</span>
          </div>
        </header>

        <div className="dashboard-hero">
          <img src={dashboard} alt="dashboard" className="dashboard-image" />
          <div className="overlay">
            <h2>Hello {user.name} 👋</h2>
            <p>Welcome to your dashboard — check reports or profile for details.</p>
          </div>
        </div>

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
      </div>
    );
  }

  return <h2>❌ Invalid Role</h2>;
}

export default Dashboard;
