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
  const [selectedWorker, setSelectedWorker] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workerHistory, setWorkerHistory] = useState([]);
  const [workerSummary, setWorkerSummary] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const API_URL =
    "https://attendance-management-backend-vh2w.onrender.com/api/attendance";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(savedUser);
    setUser(u);

   
    if (u.role === "manager") {
      setSelectedSite(u.site);
      fetchWorkersBySite(u.site, "manager");
    } else if (u.role === "worker") {
      setSelectedSite(u.site);
      setSelectedWorker(u._id);
      fetchWorkersBySite(u.site, "worker");
    }
  }, [navigate]);

  const fetchWorkersBySite = async (site, role = user?.role) => {
    try {
      const res = await axios.get(`${API_URL}/workers`);
      let filtered = res.data;

      if (role === "manager") {
        filtered = filtered.filter((w) => w.site === site);
      } else if (role === "worker") {
        filtered = filtered.filter((w) => w._id === user._id);
      } else if (site) {
        filtered = filtered.filter((w) => w.site === site);
      }

      setWorkers(filtered);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  const handleSiteChange = (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    setSelectedWorker("");
    setShowReport(false);
    if (site) fetchWorkersBySite(site);
    else setWorkers([]);
  };

  const handleWorkerChange = (e) => {
    setSelectedWorker(e.target.value);
    setShowReport(false);
  };

  const fetchHistoryByDateRange = async () => {
    if (!selectedWorker || !startDate || !endDate) {
      alert("⚠️ Please select site, worker, start date, and end date.");
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/worker-history/${selectedWorker}?start=${startDate}&end=${endDate}`
      );

      if (res.data.success) {
        let workerName = "";
        let salary = 0;

  
        if (user.role === "worker") {
          workerName = user.name;
          salary = user.perDaySalary || 0;
        } else {
          const worker = workers.find((w) => w._id === selectedWorker);
          workerName = worker?.name || "";
          salary = worker?.perDaySalary || 0;
        }

        setWorkerHistory(res.data.history);
        setWorkerSummary({
          ...res.data.summary,
          perDaySalary: salary,
          name: workerName,
        });
      } else {
        setWorkerHistory([]);
        setWorkerSummary(null);
      }

      setShowReport(true);
    } catch (err) {
      console.error(err);
      setWorkerHistory([]);
      setWorkerSummary(null);
      setShowReport(true);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Attendance Report", 14, 15);
    doc.setFontSize(11);

    doc.text(
      `Site: ${selectedSite || "N/A"} | Worker: ${workerSummary?.name || "N/A"}`,
      14,
      25
    );
    doc.text(`Date Range: ${startDate} → ${endDate}`, 14, 32);

    if (workerHistory.length > 0) {
      autoTable(doc, {
        startY: 40,
        head: [["Sr No", "Date", "Status"]],
        body: workerHistory.map((h, i) => [i + 1, h.date, h.status]),
      });
    } else {
      doc.text("No attendance records found for selected range.", 14, 40);
    }

    if (workerSummary) {
      const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60;
      doc.setFontSize(13);
      doc.text("Attendance Summary", 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [["Status", "Count"]],
        body: [
          ["Present", workerSummary.Present || 0],
          ["Absent", workerSummary.Absent || 0],
          ["Leave", workerSummary.Leave || 0],
        ],
      });

      const totalPayment =
        (workerSummary.Present || 0) * (workerSummary.perDaySalary || 0);

      const y2 = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.text(`Per Day Salary: ₹${workerSummary.perDaySalary}`, 14, y2);
      doc.text(`Total Payment: ₹${totalPayment}`, 14, y2 + 7);
    }

    const fileName = `Attendance_Report_${selectedSite}_${startDate}_to_${endDate}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="report-container">
      <h2
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#f39c12",
        }}
      >
        📊 Attendance Report
        {showReport && (
          <button
            onClick={downloadPDF}
            style={{
              background: "#27ae60",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📥 Download PDF
          </button>
        )}
      </h2>

      <div style={{ marginBottom: "20px", marginTop: "10px" }}>
        <label>
          🗓️ Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginLeft: "8px", padding: "6px" }}
          />
        </label>

        <label>
          🗓️ End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ marginLeft: "8px", padding: "6px" }}
          />
        </label>

        {user?.role === "admin" ? (
          <label>
            🏗️ Site:
            <select
              value={selectedSite}
              onChange={handleSiteChange}
              style={{ padding: "6px", marginLeft: "10px" }}
            >
              <option value="">-- Select Site --</option>
              {sites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            🏗️ Site: <strong>{selectedSite}</strong>
          </label>
        )}

        {user?.role !== "worker" && (
          <label  style={{ marginLeft: "20px" }}>
            👷 Worker:
            <select
              value={selectedWorker}
              onChange={handleWorkerChange}
              disabled={!selectedSite}
              style={{ padding: "6px", marginLeft: "20px" }}
            >
              <option value="">-- Select Worker --</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          onClick={fetchHistoryByDateRange}
          style={{
            padding: "8px 20px",
            backgroundColor: "#2C3E50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          🔍 Get Report
        </button>
      </div>

      {showReport && (
        <>
          <h3>👷 Worker: {workerSummary?.name || "N/A"}</h3>
          <h3>
            🧾 Attendance History ({startDate} → {endDate})
          </h3>

          <table
            border="1"
            cellPadding="8"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead style={{ background: "#2C3E50", color: "white" }}>
              <tr>
                <th>Sr No</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workerHistory.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                workerHistory.map((h, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{h.date}</td>
                    <td>{h.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {workerSummary && (
            <>
              <h3 style={{ marginTop: "25px" }}>📈 Attendance Summary</h3>
              <table
                border="1"
                cellPadding="8"
                style={{
                  width: "50%",
                  borderCollapse: "collapse",
                  marginTop: "10px",
                }}
              >
                <thead style={{ background: "#34495E", color: "white" }}>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Present</td>
                    <td>{workerSummary.Present}</td>
                  </tr>
                  <tr>
                    <td>Absent</td>
                    <td>{workerSummary.Absent}</td>
                  </tr>
                  <tr>
                    <td>Leave</td>
                    <td>{workerSummary.Leave}</td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "40px",
                  marginTop: "25px",
                  padding: "15px 25px",
                  borderRadius: "10px",
                  backgroundColor: "#1E2A38",
                  color: "#ecf0f1",
                  fontSize: "18px",
                }}
              >
                <div>
                  💰 <strong>Per Day Salary:</strong> ₹
                  {workerSummary.perDaySalary}
                </div>
                <div>
                  💵 <strong>Total Payment:</strong> ₹
                  {(workerSummary.Present || 0) *
                    (workerSummary.perDaySalary || 0)}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
