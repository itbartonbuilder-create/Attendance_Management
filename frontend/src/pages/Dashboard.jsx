import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [latestAttendance, setLatestAttendance] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      if (parsedUser.role === "manager") {
        fetchManagerData();
      }
    }
  }, []);

  const fetchManagerData = async () => {
    try {
      // const res1 = await axios.get("http://localhost:8000/api/workers/count");
      // setTotalWorkers(res1.data.count);

      // const res2 = await axios.get("http://localhost:8000/api/attendance/summary");
      // setAttendanceSummary(res2.data.summary);

      // const res3 = await axios.get("http://localhost:8000/api/attendance/workers/latest-attendance");
      // setLatestAttendance(res3.data.records);

      const res4 = await axios.get("http://localhost:8000/api/workers");  
      setAllWorkers(res4.data);
    } catch (err) {
      console.error("Error fetching manager data:", err);
    }
  };

  if (!user) return <h2>❌ Not Authorized</h2>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.name} ({user.role})</h2>

      {user.role === "manager" && (
        <>
          <h3>📊 Manager Dashboard</h3>

          {/* <div>
            <p><strong>Total Workers:</strong> {totalWorkers}</p>
            <h4>👷 All Employees</h4>
            <table border="1" cellPadding="8" style={{ width: "100%", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Site</th>
                </tr>
              </thead>
              <tbody>
                {allWorkers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>No workers found</td>
                  </tr>
                ) : (
                  allWorkers.map((worker, index) => (
                    <tr key={worker._id}>
                      <td>{index + 1}</td>
                      <td>{worker.name}</td>
                      <td>{worker.role}</td>
                      <td>{worker.site}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div> */}
        </>
      )}
    </div>
  );
}

export default Dashboard;
