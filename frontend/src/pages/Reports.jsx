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
    } else if (u.role === "admin") {
      setWorkers([]);
    }
  }, [navigate]);


  const fetchWorkersBySite = async (site, role = user?.role) => {
    try {
      const res = await axios.get(`${API_URL}/workers`);
      let filtered = res.data;
      if (role === "manager") filtered = filtered.filter((w) => w.site === site);
      else if (site) filtered = filtered.filter((w) => w.site === site);
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
    else setWorkers([]);
  };


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
          allData.push({
            worker: w,
            history: res.data.history,
            summary: {
              ...res.data.summary,
              perDaySalary: w.perDaySalary,
            },
          });
        } else {
          allData.push({
            worker: w,
            history: [],
            summary: {
              Present: 0,
              Absent: 0,
              Leave: 0,
              perDaySalary: w.perDaySalary,
            },
          });
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

  const downloadPDF = () => {
    if (selectedWorkers.length === 0) {
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

    workerData
      .filter((wd) => selectedWorkers.includes(wd.worker._id))
      .forEach((wd, idx) => {
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
            head: [["Sr No", "Date", "Status"]],
            body: wd.history.map((h, i) => [i + 1, h.date, h.status]),
            styles: { fontSize: 10 },
            margin: { left: 14 },
          });
        } else {
          doc.text("No attendance records found.", 14, yPos + 5);
        }

        const yAfterTable = doc.lastAutoTable
          ? doc.lastAutoTable.finalY + 10
          : yPos + 15;

       
        autoTable(doc, {
          startY: yAfterTable,
          head: [["Status", "Count"]],
          body: [
            ["Present", wd.summary.Present || 0],
            ["Absent", wd.summary.Absent || 0],
            ["Leave", wd.summary.Leave || 0],
          ],
          styles: { fontSize: 10 },
          margin: { left: 14 },
        });

        const totalPayment =
          (wd.summary.Present || 0) * (wd.summary.perDaySalary || 0);
        const y2 = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(11);
        doc.text(`Per Day Salary: Rs. ${wd.summary.perDaySalary}`, 14, y2);
        doc.text(`Total Payment: Rs. ${totalPayment}`, 14, y2 + 6);

        yPos = y2 + 14;

        if (idx < selectedWorkers.length - 1 && yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      });

    doc.save(`Attendance_Report_${selectedSite}_${startDate}_to_${endDate}.pdf`);
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
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          🔍 Get Report
        </button>
      </div>

      {showReport && (
        <>
          <h3>
            👷 All Workers Attendance ({startDate} to {endDate})
          </h3>

          {workerData.length === 0 ? (
            <p>No records found.</p>
          ) : (
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
                  <th>Select</th>
                  <th>Worker Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Per Day Salary</th>
                  <th>Total Payment</th>
                </tr>
              </thead>
              <tbody>
                {workerData.map((wd) => (
                  <tr key={wd.worker._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(wd.worker._id)}
                        onChange={() => handleCheckboxChange(wd.worker._id)}
                      />
                    </td>
                    <td>{wd.worker.name}</td>
                    <td>{wd.summary.Present}</td>
                    <td>{wd.summary.Absent}</td>
                    <td>{wd.summary.Leave}</td>
                    <td>Rs. {wd.summary.perDaySalary}</td>
                    <td>
                      Rs.{" "}
                      {(wd.summary.Present || 0) *
                        (wd.summary.perDaySalary || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
