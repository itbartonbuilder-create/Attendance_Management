import React, { useEffect, useState } from "react";
import axios from "axios";

function Attendance() {
  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);
  const [selectedSite, setSelectedSite] = useState("");
  const [workers, setWorkers] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchWorkersBySite = async (site) => {
    try {
      const res = await axios.get("http://localhost:8000/api/workers");
      const filtered = res.data.filter((w) => w.site === site);
      const initial = filtered.map((w, index) => ({
        srNo: index + 1,
        workerId: w._id,
        name: w.name,
        roleType: w.roleType,
        role: w.role,
        status: "",
      }));
      setWorkers(initial);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  useEffect(() => {
    if (selectedSite) fetchWorkersBySite(selectedSite);
    else setWorkers([]);
  }, [selectedSite]);

  const handleStatusChange = (id, status) => {
    setWorkers(workers.map((w) => (w.workerId === id ? { ...w, status } : w)));
  };

  const submitAttendance = async () => {
    try {
      await axios.post("http://localhost:8000/api/attendance", {
        date,
        site: selectedSite,
        records: workers.map((w) => ({
          workerId: w.workerId,
          name: w.name,
          roleType: w.roleType,
          role: w.role,
          status: w.status,
        })),
      });

      alert("✅ Attendance Saved Successfully!");
      setDate(new Date().toISOString().split("T")[0]);
      setSelectedSite("");
      setWorkers([]);
    } catch (err) {
      console.error(err);
      alert("❌ Error saving attendance.");
    }
  };

  return (
    <div className="attendance-container">
      <h2>📝 Mark Attendance</h2>

      <label>
        Select Date:{" "}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginRight: "20px" }}
        />
      </label>

      <label>
        Select Site:{" "}
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
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

      {workers.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ marginTop: "15px", borderCollapse: "collapse", width: "100%" }}
        >
          <thead style={{ background: "#2C3E50", color: "white" }}>
            <tr>
              <th>Sr No.</th>
              <th>Name</th>
              <th>Role Type</th>
              <th>Sub Role</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Leave</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.workerId}>
                <td>{w.srNo}</td>
                <td>{w.name}</td>
                <td>{w.roleType}</td>
                <td>{w.role}</td>
                <td>
                  <input
                    type="radio"
                    name={`status-${w.workerId}`}
                    checked={w.status === "Present"}
                    onChange={() => handleStatusChange(w.workerId, "Present")}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    name={`status-${w.workerId}`}
                    checked={w.status === "Absent"}
                    onChange={() => handleStatusChange(w.workerId, "Absent")}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    name={`status-${w.workerId}`}
                    checked={w.status === "Leave"}
                    onChange={() => handleStatusChange(w.workerId, "Leave")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {workers.length > 0 && (
        <button
          className="submit-btn"
          style={{ marginTop: "15px", padding: "10px 20px" }}
          onClick={submitAttendance}
        >
          ✅ Submit Attendance
        </button>
      )}
    </div>
  );
}

export default Attendance;
