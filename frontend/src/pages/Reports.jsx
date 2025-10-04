import React, { useEffect, useState } from "react";
import axios from "axios";

function AttendanceReport() {
  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);
  const [selectedSite, setSelectedSite] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [records, setRecords] = useState([]);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [workerSummary, setWorkerSummary] = useState(null);

  const fetchWorkersBySite = async (site) => {
    const res = await axios.get("http://localhost:8000/api/attendance/workers");
    const filtered = res.data.filter((w) => w.site === site);
    setWorkers(filtered);
  };

  const fetchReport = async () => {
    try {
      let url = `http://localhost:8000/api/attendance/reports?date=${date}`;
      if (selectedWorker) {
        url += `&workerId=${selectedWorker}`;
      }

      const res = await axios.get(url);
      if (res.data.success) {
        setRecords(res.data.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error(err);
      setRecords([]);
    }
  };

  const fetchWorkerHistory = async (workerId) => {
    if (!workerId) {
      setWorkerHistory([]);
      setWorkerSummary(null);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:8000/api/attendance/worker-history/${workerId}`);
      if (res.data.success) {
        setWorkerHistory(res.data.history);
        setWorkerSummary(res.data.summary);
      } else {
        setWorkerHistory([]);
        setWorkerSummary(null);
      }
    } catch (err) {
      console.error(err);
      setWorkerHistory([]);
      setWorkerSummary(null);
    }
  };

  const handleSiteChange = (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    setSelectedWorker("");
    if (site) {
      fetchWorkersBySite(site);
    } else {
      setWorkers([]);
    }
  };

  const handleWorkerChange = (e) => {
    const workerId = e.target.value;
    setSelectedWorker(workerId);
  };

  const handleGetReportClick = () => {
    fetchReport();
  };

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    fetchWorkerHistory(selectedWorker);
  }, [selectedWorker]);

  return (
    <div className="report-container">
      <h2>📋 Attendance Report</h2>

      <label>
        Select Date:{" "}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginRight: "20px" }}
        />
      </label>

      <label style={{ marginLeft: "20px" }}>
        Select Site:{" "}
        <select
          value={selectedSite}
          onChange={handleSiteChange}
          style={{ padding: "12px 15px", marginTop: "10px", marginBottom: "20px" }}
        >
          <option value="">-- Select Site --</option>
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
       <button onClick={handleGetReportClick} style={{ marginLeft: "10px" }}>
        🔍 Get Report
      </button>

      <label style={{ marginLeft: "20px" }}>
        Select Worker:{" "}
        <select
          value={selectedWorker}
          onChange={handleWorkerChange}
          disabled={!selectedSite}
        >
          <option value="">All Workers</option>
          {workers.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>

      <button onClick={handleGetReportClick} style={{ marginLeft: "10px" }}>
        🔍 Get Report
      </button>

      <h3 style={{ marginTop: "20px" }}>📅 Attendance on {date}</h3>
      <table border="1" cellPadding="8" style={{ width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>No records found</td>
            </tr>
          ) : (
            records.map((rec, index) => (
              <tr key={rec.workerId}>
                <td>{index + 1}</td>
                <td>{rec.name}</td>
                <td>{rec.role}</td>
                <td>{rec.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedWorker && (
        <>
          <h3 style={{ marginTop: "20px" }}>🧾 Full Attendance History</h3>
          <table border="1" cellPadding="8" style={{ width: "100%", marginTop: "10px" }}>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workerHistory.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>No history found for selected worker.</td>
                </tr>
              ) : (
                workerHistory.map((h, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{h.date}</td>
                    <td>{h.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: "20px" }}>📊 Summary</h3>
          {workerSummary ? (
            <table border="1" cellPadding="8" style={{ width: "50%", marginTop: "10px" }}>
              <thead>
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
          ) : (
            <p>No summary data available.</p>
          )}
        </>
      )}
    </div>
  );
}

export default AttendanceReport;