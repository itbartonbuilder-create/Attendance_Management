import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AttendanceReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sites] = useState(["Bangalore", "Japuriya", "Noida", "Delhi"]);
  const [selectedSite, setSelectedSite] = useState("Bangalore");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:5000/api/attendance";

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) navigate("/login");
    else setUser(loggedUser);
  }, [navigate]);

  // ✅ Fetch all workers
  const fetchWorkers = async () => {
    const res = await axios.get(`${API_URL}/workers`);
    return res.data;
  };

  // ✅ Fetch attendance history for all workers
  const fetchAllWorkerHistory = async () => {
    if (!startDate || !endDate || !selectedSite) {
      alert("Please select Start Date, End Date and Site");
      return;
    }
    setLoading(true);
    try {
      const workers = await fetchWorkers();
      const report = [];

      for (let w of workers) {
        const res = await axios.get(
          `${API_URL}/worker-history/${w._id}?start=${startDate}&end=${endDate}&site=${selectedSite}`
        );

        const history = res.data.history || [];
        let present = 0,
          absent = 0,
          leave = 0,
          paidLeave = 0,
          unpaidLeave = 0,
          totalHours = 0,
          overtime = 0,
          totalPayment = 0;

        history.forEach((h) => {
          if (h.status === "Present") {
            present++;
            totalHours += h.hoursWorked;
            overtime += h.overtimeHours;
            totalPayment += h.salary;
          } else if (h.status === "Absent") {
            absent++;
          } else if (h.status === "Leave") {
            leave++;
            if (h.leaveType?.paid) paidLeave++;
            else unpaidLeave++;
          }
        });

        report.push({
          name: w.name,
          role: w.role,
          site: w.site,
          present,
          absent,
          leave,
          paidLeave,
          unpaidLeave,
          totalHours,
          overtime,
          totalPayment,
        });
      }

      setReportData(report);
    } catch (err) {
      console.error("🚨 Error generating report:", err);
      alert("Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download PDF Report
  const downloadPDF = () => {
    if (reportData.length === 0) {
      alert("No report data to export!");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Bartons Builders Limited", 14, 15);
    doc.setFontSize(12);
    doc.text(
      `Attendance Report (${startDate} to ${endDate}) - Site: ${selectedSite}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "Worker Name",
          "Present",
          "Absent",
          "Leave",
          "Paid Leave",
          "Unpaid Leave",
          "Total Hours",
          "Overtime (hrs)",
          "Total Payment (₹)",
        ],
      ],
      body: reportData.map((r) => [
        r.name,
        r.present,
        r.absent,
        r.leave,
        r.paidLeave,
        r.unpaidLeave,
        r.totalHours,
        r.overtime,
        r.totalPayment.toFixed(2),
      ]),
    });

    doc.save(`Attendance_Report_${selectedSite}_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="report-container">
      <div className="header">
        <h2>
          📋 <span style={{ color: "orange" }}>Attendance Report</span>
        </h2>
      </div>

      <div className="filter-section">
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <label>
          Site:
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            {sites.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button className="btn-get" onClick={fetchAllWorkerHistory} disabled={loading}>
          {loading ? "Loading..." : "🔍 Get Report"}
        </button>

        <button className="btn-download" onClick={downloadPDF}>
          📥 Download PDF
        </button>
      </div>

      <div className="report-table">
        <h4>
          👷 Attendance Summary ({startDate || "Start"} to {endDate || "End"})
        </h4>
        <table>
          <thead>
            <tr>
              <th>Worker Name</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Leave</th>
              <th>Paid Leave</th>
              <th>Unpaid Leave</th>
              <th>Total Hours</th>
              <th>Overtime (hrs)</th>
              <th>Total Payment (₹)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length > 0 ? (
              reportData.map((r, index) => (
                <tr key={index}>
                  <td>{r.name}</td>
                  <td>{r.present}</td>
                  <td>{r.absent}</td>
                  <td>{r.leave}</td>
                  <td>{r.paidLeave}</td>
                  <td>{r.unpaidLeave}</td>
                  <td>{r.totalHours}</td>
                  <td style={{ color: r.overtime > 0 ? "limegreen" : "red" }}>
                    {r.overtime}
                  </td>
                  <td>₹{r.totalPayment.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  No report data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendanceReport;
