import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AttendanceReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [recordType, setRecordType] = useState("");
  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad", "jim corbett"]);
  const [selectedSite, setSelectedSite] = useState("");

  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [workerData, setWorkerData] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const API_BASE =
    "https://attendance-management-backend-vh2w.onrender.com/api";

  // ---------------- AUTH ----------------
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    // ✅ MANAGER → AUTO SELECT HIS SITE
    if (parsedUser.role === "manager" && parsedUser.site) {
      setSelectedSite(parsedUser.site);
    }
  }, [navigate]);

  // ---------------- FETCH WORKERS ----------------
  const fetchPeopleBySite = async (site) => {
    try {
      const url =
        recordType === "employee"
          ? `${API_BASE}/employees`
          : `${API_BASE}/workers`;

      const res = await axios.get(url);
      setWorkers(res.data.filter((p) => p.site === site));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSiteChange = (e) => {
    // ✅ MANAGER CAN'T CHANGE SITE
    if (user?.role === "manager") return;

    const site = e.target.value;
    setSelectedSite(site);
    setShowReport(false);
    setSelectedWorkers([]);
    if (site && recordType) fetchPeopleBySite(site);
  };

  // ---------------- GET REPORT ----------------
  const fetchAllHistory = async () => {
    if (!recordType || !selectedSite || !startDate || !endDate) {
      alert("Please select all filters");
      return;
    }

    const allData = [];

    for (let p of workers) {
      try {
        const res = await axios.get(
          `${API_BASE}/attendance/worker-history/${p._id}?start=${startDate}&end=${endDate}`
        );

        if (res.data.success) {
          let summary = {
            present: 0,
            absent: 0,
            leave: 0,
            paidLeave: 0,
            unpaidLeave: 0,
            totalHours: 0,
            overtimeHours: 0,
            overtimePay: 0,
            totalPayment: 0,
          };

          const perDaySalary = p.perDaySalary || p.salary || 0;
          const overtimeRate = perDaySalary / 8;

          res.data.history.forEach((h) => {
            if (h.status === "Present") {
              summary.present++;
              summary.totalHours += h.hoursWorked || 0;
              summary.overtimeHours += h.overtimeHours || 0;
            } else if (h.status === "Absent") {
              summary.absent++;
            } else if (h.status === "Leave") {
              summary.leave++;
              if (h.leaveType?.holiday || h.leaveType?.accepted) {
                summary.paidLeave++;
                summary.totalPayment += perDaySalary;
              } else {
                summary.unpaidLeave++;
              }
            }
          });

          summary.overtimePay = summary.overtimeHours * overtimeRate;
          summary.totalPayment +=
            summary.present * perDaySalary + summary.overtimePay;

          allData.push({ worker: p, history: res.data.history, summary });
        }
      } catch (err) {
        console.error(err);
      }
    }

    setWorkerData(allData);
    setShowReport(true);
  };

  // ---------------- PDF ----------------
  const downloadPDF = () => {
    if (selectedWorkers.length === 0 && user?.role !== "worker") {
      alert("Select at least one record");
      return;
    }

    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(16);
    doc.text("Attendance Report", 14, y);
    y += 10;

    workerData
      .filter(
        (wd) =>
          user?.role === "worker" ||
          selectedWorkers.includes(wd.worker._id)
      )
      .forEach((wd, index) => {
        const perDaySalary =
          wd.worker.perDaySalary || wd.worker.salary || 0;

        doc.setFontSize(12);
        doc.text(`Name: ${wd.worker.name}`, 14, y);
        y += 6;
        doc.text(`Per Day Salary: ₹${perDaySalary}`, 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["Date", "Status", "Hours", "Overtime"]],
          body: wd.history.map((h) => [
            h.date,
            h.status,
            h.hoursWorked || 0,
            h.overtimeHours || 0,
          ]),
          theme: "grid",
        });

        y = doc.lastAutoTable.finalY + 6;

        autoTable(doc, {
          startY: y,
          head: [["Summary", "Value"]],
          body: [
            ["Present Days", wd.summary.present],
            ["Absent Days", wd.summary.absent],
            ["Leave Days", wd.summary.leave],
            ["Paid Leave", wd.summary.paidLeave],
            ["Unpaid Leave", wd.summary.unpaidLeave],
            ["Total Hours", wd.summary.totalHours],
            ["Overtime Hours", wd.summary.overtimeHours],
            ["Overtime Pay (₹)", wd.summary.overtimePay.toFixed(2)],
            ["Total Payment (₹)", wd.summary.totalPayment.toFixed(2)],
          ],
          theme: "striped",
        });

        y = doc.lastAutoTable.finalY + 12;

        if (index !== workerData.length - 1) {
          doc.addPage();
          y = 15;
        }
      });

    doc.save("Attendance_Report.pdf");
  };

  return (
    <div className="report-container">
      <h2 style={{ color: "#f39c12" }}>📊 Attendance Report</h2>

      <div className="filter-box">
        <label>
          Select Type:
          <select
            value={recordType}
            onChange={(e) => {
              setRecordType(e.target.value);
              setShowReport(false);
              if (user?.role === "manager") {
                fetchPeopleBySite(selectedSite);
              }
            }}
          >
            <option value="">-- Select --</option>
            <option value="worker">Worker</option>
            <option value="employee">Employee</option>
          </select>
        </label>

        {recordType && (
          <label>
            Site:
            <select
              value={selectedSite}
              onChange={handleSiteChange}
              disabled={user?.role === "manager"}
            >
              <option value="">-- Select Site --</option>
              {sites.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}

        {selectedSite && (
          <>
            Start Date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            End Date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button onClick={fetchAllHistory}>Get Report</button>
          </>
        )}
      </div>

      {showReport && (
        <>
          <button onClick={downloadPDF}>Download PDF</button>

          <table>
            <thead>
              <tr>
                {user?.role !== "worker" && <th>Select</th>}
                <th>Name</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Paid Leave</th>
                <th>Unpaid Leave</th>
                <th>Total Hours</th>
                <th>Overtime (hrs)</th>
                <th>Overtime Pay (₹)</th>
                <th>Total Payment (₹)</th>
              </tr>
            </thead>
            <tbody>
              {workerData.map((wd) => (
                <tr key={wd.worker._id}>
                  {user?.role !== "worker" && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(wd.worker._id)}
                        onChange={() =>
                          setSelectedWorkers((p) =>
                            p.includes(wd.worker._id)
                              ? p.filter((i) => i !== wd.worker._id)
                              : [...p, wd.worker._id]
                          )
                        }
                      />
                    </td>
                  )}
                  <td>{wd.worker.name}</td>
                  <td>{wd.summary.present}</td>
                  <td>{wd.summary.absent}</td>
                  <td>{wd.summary.leave}</td>
                  <td>{wd.summary.paidLeave}</td>
                  <td>{wd.summary.unpaidLeave}</td>
                  <td>{wd.summary.totalHours}</td>
                  <td>{wd.summary.overtimeHours}</td>
                  <td>₹{wd.summary.overtimePay.toFixed(2)}</td>
                  <td>₹{wd.summary.totalPayment.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
