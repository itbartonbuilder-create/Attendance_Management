import React, { useEffect, useState } from "react";
import API from "../api";
import dashboard from "../assets/dashboard.jpg";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "../App.css";

function Dashboard() {

  const [user, setUser] = useState(null);
  const [siteChart, setSiteChart] = useState([]);
  const [roleChart, setRoleChart] = useState([]);
  // const [weatherData, setWeatherData] = useState([]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) return;

    setUser(savedUser);
    fetchAllWorkers(savedUser);
    // fetchWeather(savedUser);
  }, []);

  // 🌤 Weather fetch role based
  // const fetchWeather = async (loggedUser) => {
  //   try {
  //     let url = "/weather/sites";

  //     // manager → sirf apni site
  //     if (loggedUser.role === "manager") {
  //       url += `?site=${loggedUser.weatherCity}`;
  //     }

  //     const res = await API.get(url);

  //     const formatted = res.data.map(w => ({
  //       city: w.site,
  //       temp: w.temp ? Math.round(w.temp) : "--",
  //       type: w.condition || null
  //     }));

  //     setWeatherData(formatted);
  //   } catch (err) {
  //     console.error("Weather error:", err);
  //   }
  // };

  // 📊 Workers role based
  const fetchAllWorkers = async (loggedUser) => {
    try {
      const res = await API.get("/workers");
      let workers = res.data;

      // ⭐ MANAGER FILTER
      if (loggedUser.role === "manager") {
        workers = workers.filter(w => w.site === loggedUser.site);
      }

      // Bar chart
      const siteCount = {};
      workers.forEach(w => {
        siteCount[w.site] = (siteCount[w.site] || 0) + 1;
      });

      setSiteChart(
        Object.keys(siteCount).map(site => ({
          site,
          workers: siteCount[site]
        }))
      );

      // Pie chart
      const roleCount = {};
      workers.forEach(w => {
        roleCount[w.role] = (roleCount[w.role] || 0) + 1;
      });

      setRoleChart(
        Object.keys(roleCount).map(role => ({
          name: role,
          value: roleCount[role]
        }))
      );

    } catch (err) {
      console.error(err);
    }
  };

  // 🌤 helpers
  // const getWeatherIcon = (type) => {
  //   if (!type) return "🌤";
  //   if (type.includes("Rain")) return "🌧";
  //   if (type.includes("Cloud")) return "☁";
  //   if (type.includes("Clear")) return "☀";
  //   if (type.includes("Haze")) return "🌫";
  //   return "🌤";
  // };

  // const getWeatherMessage = (type) => {
  //   if (!type) return "Weather unavailable";
  //   if (type.includes("Rain")) return "Work may slow";
  //   if (type.includes("Clear")) return "Perfect for work";
  //   if (type.includes("Cloud")) return "Good for work";
  //   if (type.includes("Haze")) return "Safety alert";
  //   return "Normal conditions";
  // };

  if (!user) return <h2>❌ Not Authorized</h2>;

  return (

       <div className="dashboard">
      <div className="dashboard-hero">
        <img src={dashboard} alt="dashboard" className="dashboard-image" />
        <div className="overlay">
          <h2>Welcome, {user.name} 👋</h2>
          <p>Manage your workforce and site operations efficiently</p>
        </div>
      </div>
     

      {/* 🌤 WEATHER */}
      {/* <section className="weather-section">
        <h2>Live Weather</h2>
        <div className="weather-grid">
          {weatherData.map((w, i) => (
            <div key={i} className="weather-card">
              <h3>{w.city} Site</h3>
              <h1>{getWeatherIcon(w.type)} {w.temp}°C</h1>
              <p>{getWeatherMessage(w.type)}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* 📊 CHARTS */}
      <section className="charts-section container">
        <div className="chart-box">
          <h3>Workers Per Site</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={siteChart}>
              <XAxis dataKey="site" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="workers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Role Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={roleChart} dataKey="value" nameKey="name" outerRadius={110} label>
                {roleChart.map((_, i) => <Cell key={i} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;
