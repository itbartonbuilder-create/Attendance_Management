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
    }
  }, [navigate]);

  const fetchWorkersBySite = async (site) => {
    try {
      const res = await axios.get(`${API_URL}/workers`);
      setWorkers(res.data.filter((w) => w.site === site));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllWorkerHistory = async () => {
    if (!selectedSite || !startDate || !endDate)
      return alert("Please select site, start date, and end date.");

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Attendance Report", 14, 15);
    doc.text(`Site: ${selectedSite}`, 14, 25);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);

    workerData.forEach((wd, i) => {
      const baseSalary = wd.summary.Present * wd.worker.perDaySalary;
      const overtimePay =
        (wd.summary.overtimeHours * wd.worker.perDaySalary) / 8;
      const totalPayment = baseSalary + overtimePay;

      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY + 15 || 40,
        head: [[`👷 ${wd.worker.name}`, "", "", "", ""]],
        body: [
          ["Present", "Absent", "Leave", "Overtime (hrs)", "Total Hours"],
          [
            wd.summary.Present,
            wd.summary.Absent,
            wd.summary.Leave,
            wd.summary.overtimeHours,
            wd.summary.totalHours,
          ],
        ],
      });

      doc.text(
        `Total Payment: ₹${totalPayment.toFixed(2)} (Including Overtime ₹${overtimePay.toFixed(
          2
        )})`,
        14,
        doc.lastAutoTable.finalY + 8
      );
    });

    doc.save(`Attendance_Report_${selectedSite}.pdf`);
  };

  return (
    <div className="report-container">
      <h2 style={{ color: "#f39c12" }}>📊 Attendance Report</h2>

      <div style={{ marginBottom: 20 }}>
        <label>Start Date: </label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label style={{ marginLeft: 10 }}>End Date: </label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <label style={{ marginLeft: 10 }}>Site: </label>
        <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
          <option value="">-- Select Site --</option>
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={fetchAllWorkerHistory} style={{ marginLeft: 10 }}>
          🔍 Get Report
        </button>
      </div>

      {showReport && (
        <>
          <h3>
            Attendance Report ({startDate} → {endDate})
          </h3>
          <table border="1" cellPadding="8" width="100%" style={{ borderCollapse: "collapse" }}>
            <thead style={{ background: "#2C3E50", color: "white" }}>
              <tr>
                <th>Worker</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Total Hours</th>
                <th>Overtime Hours</th>
                <th>Per Day Salary</th>
                <th>Total Payment</th>
              </tr>
            </thead>
            <tbody>
              {workerData.map((wd) => {
                const baseSalary = wd.summary.Present * wd.worker.perDaySalary;
                const overtimePay =
                  (wd.summary.overtimeHours * wd.worker.perDaySalary) / 8;
                const totalPayment = baseSalary + overtimePay;
                return (
                  <tr key={wd.worker._id}>
                    <td>{wd.worker.name}</td>
                    <td>{wd.summary.Present}</td>
                    <td>{wd.summary.Absent}</td>
                    <td>{wd.summary.Leave}</td>
                    <td>{wd.summary.totalHours}</td>
                    <td>{wd.summary.overtimeHours}</td>
                    <td>₹{wd.worker.perDaySalary}</td>
                    <td>₹{totalPayment.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={downloadPDF} style={{ marginTop: 15 }}>
            📥 Download PDF
          </button>
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
