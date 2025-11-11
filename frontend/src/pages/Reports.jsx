import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AttendanceReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);
  const [selectedSite, setSelectedSite] = useState("");
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workerData, setWorkerData] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const API_URL = "https://attendance-management-backend-vh2w.onrender.com/api/attendance";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return navigate("/login");
    const u = JSON.parse(savedUser);
    setUser(u);

    if (u.role === "manager") {
      setSelectedSite(u.site);
      fetchWorkersBySite(u.site);
    } else if (u.role === "admin") {
      setWorkers([]);
    } else if (u.role === "worker") {
      setSelectedSite(u.site);
      fetchWorkerDetails(u);
    }
  }, [navigate]);

  const fetchWorkerDetails = async (u) => {
    try {
      const res = await axios.get(`${API_URL}/workers`);
      const workerInfo = res.data.find((w) => w._id === u._id);
      setWorkers([workerInfo || u]);
    } catch {
      setWorkers([{ ...u, perDaySalary: u.perDaySalary || 0 }]);
    }
  };

  const fetchWorkersBySite = async (site) => {
    const res = await axios.get(`${API_URL}/workers`);
    setWorkers(res.data.filter((w) => w.site === site));
  };

  const handleSiteChange = (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    setShowReport(false);
    if (site) fetchWorkersBySite(site);
  };

  const fetchAllWorkerHistory = async () => {
    if (!selectedSite || !startDate || !endDate)
      return alert("⚠️ Please select site, start date, and end date.");

    const allData = [];

    for (let w of workers) {
      const res = await axios.get(
        `${API_URL}/worker-history/${w._id}?start=${startDate}&end=${endDate}`
      );
      if (res.data.success) {
        const { history, summary } = res.data;
        allData.push({ worker: w, history, summary });
      }
    }

    setWorkerData(allData);
    setShowReport(true);
  };

  const handleCheckboxChange = (id) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ Calculate total payment correctly (only paid days count)
  const calculateSalary = (wd) => {
    const paidDays = wd.summary.Present + wd.summary.PaidLeave;
    const baseSalary = paidDays * (wd.summary.perDaySalary || 0);
    const overtimePay = (wd.summary.overtimeTotal || 0) * (wd.summary.perDaySalary / 8);
    return baseSalary + overtimePay;
  };

  return (
    <div className="report-container">
      <h2 style={{ color: "#f39c12" }}>📊 Attendance Report</h2>

      <div style={{ marginBottom: "20px" }}>
        <label>
          🗓 Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label style={{ marginLeft: "10px" }}>
          🗓 End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        {user?.role === "admin" ? (
          <label style={{ marginLeft: "15px" }}>
            🏗 Site:
            <select value={selectedSite} onChange={handleSiteChange}>
              <option value="">-- Select Site --</option>
              {sites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <strong style={{ marginLeft: "15px" }}>🏗 Site: {selectedSite}</strong>
        )}

        <button
          onClick={fetchAllWorkerHistory}
          style={{ marginLeft: "10px", backgroundColor: "#2C3E50", color: "white" }}
        >
          🔍 Get Report
        </button>
      </div>

      {showReport && (
        <>
          <h3>
            👷 Report ({startDate} ➡ {endDate})
          </h3>
          {workerData.length === 0 ? (
            <p>No data.</p>
          ) : (
            <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#2C3E50", color: "white" }}>
                <tr>
                  {user?.role !== "worker" && <th>Select</th>}
                  <th>Worker Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Paid Leave</th>
                  <th>Holiday</th>
                  <th>Total Hours</th>
                  <th>Overtime Hours</th>
                  <th>Per Day Salary</th>
                  <th>Total Payment</th>
                </tr>
              </thead>
              <tbody>
                {workerData.map((wd) => {
                  const totalPayment = calculateSalary(wd);
                  return (
                    <tr key={wd.worker._id}>
                      {user?.role !== "worker" && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedWorkers.includes(wd.worker._id)}
                            onChange={() => handleCheckboxChange(wd.worker._id)}
                          />
                        </td>
                      )}
                      <td>{wd.worker.name}</td>
                      <td>{wd.summary.Present}</td>
                      <td>{wd.summary.Absent}</td>
                      <td>{wd.summary.Leave}</td>
                      <td>{wd.summary.PaidLeave}</td>
                      <td>{wd.summary.Holiday}</td>
                      <td>{wd.summary.totalHours || 0}</td>
                      <td>{wd.summary.overtimeTotal || 0}</td>
                      <td>₹{wd.summary.perDaySalary}</td>
                      <td>₹{totalPayment.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
