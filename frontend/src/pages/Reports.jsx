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
    if (!savedUser) {
      navigate("/login");
      return;
    }

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
    } catch (err) {
      console.error("Error fetching worker details:", err);
      setWorkers([{ ...u, perDaySalary: u.perDaySalary || 0 }]);
    }
  };

  const fetchWorkersBySite = async (site) => {
    try {
      const res = await axios.get(`${API_URL}/workers`);
      const filtered = res.data.filter((w) => w.site === site);
      setWorkers(filtered);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  const handleSiteChange = (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    setShowReport(false);
    if (site) fetchWorkersBySite(site);
  };

  // ✅ Fetch attendance data (with leave + overtime)
  const fetchAllWorkerHistory = async () => {
    if (!selectedSite || !startDate || !endDate) {
      alert("⚠️ Please select site, start date, and end date.");
      return;
    }

    const allData = [];
    for (let w of workers) {
      try {
        const res = await axios.get(
          `${API_URL}/worker-history/${w._id}?start=${startDate}&end=${endDate}`
        );

        if (res.data.success) {
          const { history } = res.data;
          let summary = {
            Present: 0,
            Absent: 0,
            Leave: 0,
            totalHours: 0,
            overtimeHours: 0,
            paidLeave: 0,
            unpaidLeave: 0,
            perDaySalary: w.perDaySalary,
          };

          history.forEach((h) => {
            if (h.status === "Present") {
              summary.Present++;
              summary.totalHours += h.hoursWorked || 0;
              summary.overtimeHours += h.overtimeHours || 0;
            } else if (h.status === "Absent") summary.Absent++;
            else if (h.status === "Leave") {
              summary.Leave++;
              if (h.leaveType?.holiday || h.leaveType?.accepted) {
                summary.paidLeave++;
                summary.totalHours += 8;
              } else summary.unpaidLeave++;
            }
          });

          allData.push({ worker: w, history, summary });
        }
      } catch (err) {
        console.error("Error fetching worker history:", err);
      }
    }

    setWorkerData(allData);
    setShowReport(true);
  };

  const handleCheckboxChange = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  // ✅ Generate PDF
  const downloadPDF = () => {
    if (user?.role !== "worker" && selectedWorkers.length === 0) {
      alert("⚠️ Please select at least one worker to download PDF.");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let yPos = 15;

    doc.setFontSize(16);
    doc.text("Attendance Report", 14, yPos);
    doc.setFontSize(11);
    doc.text(`Site: ${selectedSite}`, 14, (yPos += 10));
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, (yPos += 6));
    yPos += 6;

    const dataToPrint =
      user?.role === "worker"
        ? workerData
        : workerData.filter((wd) => selectedWorkers.includes(wd.worker._id));

    dataToPrint.forEach((wd, idx) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.text(`${idx + 1}. ${wd.worker.name}`, 14, yPos);
      yPos += 5;

      if (wd.history.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Status", "Hours Worked", "Overtime", "Leave Type"]],
          body: wd.history.map((h) => [
            h.date,
            h.status,
            h.hoursWorked || 0,
            h.overtimeHours || 0,
            h.leaveType
              ? h.leaveType.holiday
                ? "Holiday"
                : h.leaveType.accepted
                ? "Accepted Leave"
                : "-"
              : "-",
          ]),
          styles: { fontSize: 10 },
          margin: { left: 14 },
        });
      } else {
        doc.text("No attendance records found.", 14, yPos + 5);
      }

      const yAfterTable = doc.lastAutoTable
        ? doc.lastAutoTable.finalY + 10
        : yPos + 15;

      const baseSalary =
        (wd.summary.Present + wd.summary.paidLeave) * (wd.summary.perDaySalary || 0);
      const overtimePay =
        (wd.summary.overtimeHours || 0) * (wd.summary.perDaySalary / 8);
      const totalPayment = baseSalary + overtimePay;

      autoTable(doc, {
        startY: yAfterTable,
        head: [
          ["Present", "Absent", "Leave", "Paid Leave", "Unpaid Leave", "Total Hours", "Overtime"],
        ],
        body: [
          [
            wd.summary.Present,
            wd.summary.Absent,
            wd.summary.Leave,
            wd.summary.paidLeave,
            wd.summary.unpaidLeave,
            wd.summary.totalHours,
            wd.summary.overtimeHours,
          ],
        ],
        styles: { fontSize: 10 },
        margin: { left: 14 },
      });

      const y2 = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.text(`Per Day Salary: ₹${wd.summary.perDaySalary}`, 14, y2);
      doc.text(`Overtime Payment: ₹${overtimePay.toFixed(2)}`, 14, y2 + 6);
      doc.text(`Total Payment: ₹${totalPayment.toFixed(2)}`, 14, y2 + 12);

      yPos = y2 + 18;
    });

    doc.save(`Attendance_Report_${selectedSite}_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="report-container">
      <h2 style={{ display: "flex", justifyContent: "space-between", color: "#f39c12" }}>
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
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            📥 Download PDF
          </button>
        )}
      </h2>

      <div style={{ marginBottom: "20px" }}>
        <label>
          🗓️ Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginLeft: "8px", padding: "6px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          🗓️ End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ marginLeft: "8px", padding: "6px" }}
          />
        </label>

        {user?.role === "admin" ? (
          <label style={{ marginLeft: "15px" }}>
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
          <label style={{ marginLeft: "15px" }}>
            🏗️ Site: <strong>{selectedSite}</strong>
          </label>
        )}

        <button
          onClick={fetchAllWorkerHistory}
          style={{
            padding: "8px 20px",
            backgroundColor: "#2C3E50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            marginLeft: "10px",
          }}
        >
          🔍 Get Report
        </button>
      </div>

      {showReport && (
        <>
          <h3>
            👷 Attendance Summary ({startDate} to {endDate})
          </h3>

          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#2C3E50", color: "white" }}>
              <tr>
                {user?.role !== "worker" && <th>Select</th>}
                <th>Worker Name</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Paid Leave</th>
                <th>Unpaid Leave</th>
                <th>Total Hours</th>
                <th>Overtime</th>
                <th>Total Payment (₹)</th>
              </tr>
            </thead>
            <tbody>
              {workerData.map((wd) => {
                const baseSalary =
                  (wd.summary.Present + wd.summary.paidLeave) * (wd.summary.perDaySalary || 0);
                const overtimePay =
                  (wd.summary.overtimeHours || 0) * (wd.summary.perDaySalary / 8);
                const totalPayment = baseSalary + overtimePay;

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
                    <td>{wd.summary.paidLeave}</td>
                    <td>{wd.summary.unpaidLeave}</td>
                    <td>{wd.summary.totalHours}</td>
                    <td>{wd.summary.overtimeHours}</td>
                    <td>{totalPayment.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
