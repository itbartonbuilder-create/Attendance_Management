import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Attendance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);
  const [selectedSite, setSelectedSite] = useState("");
  const [workers, setWorkers] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }

    const u = JSON.parse(savedUser);
    setUser(u);
    if (u.role === "manager") setSelectedSite(u.site);
    if (u.role === "worker") {
      alert("❌ Access denied for workers.");
      navigate("/dashboard");
    }
  }, [navigate]);


  const fetchWorkersBySite = async (site) => {
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/workers"
      );

      let filtered = res.data;
      if (user.role === "manager") filtered = filtered.filter((w) => w.site === user.site);
      else if (site) filtered = filtered.filter((w) => w.site === site);

      const formatted = filtered.map((w, i) => ({
        srNo: i + 1,
        workerId: w._id,
        name: w.name,
        roleType: w.roleType,
        role: w.role,
        status: "",
      }));

      setWorkers(formatted);
    } catch (err) {
      console.error("Error fetching workers:", err);
      alert("❌ Error fetching workers.");
    }
  };

  const fetchExistingAttendance = async (site, selectedDate) => {
    if (!site || !selectedDate) return;

    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/attendance/reports",
        { params: { date: selectedDate, site } }
      );

      if (res.data?.records?.length > 0) {
        setWorkers((prev) =>
          prev.map((w) => {
            const match = res.data.records.find((r) => r.workerId === w.workerId);
            return match ? { ...w, status: match.status } : w;
          })
        );
      } else {
        setWorkers((prev) => prev.map((w) => ({ ...w, status: "" })));
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };


  useEffect(() => {
    if (!selectedSite || !user) return;
    (async () => {
      await fetchWorkersBySite(selectedSite);
      await fetchExistingAttendance(selectedSite, date);
    })();
  }, [selectedSite, date, user]);


  const handleStatusChange = (id, status) => {
    setWorkers((prev) => prev.map((w) => (w.workerId === id ? { ...w, status } : w)));
  };

  const submitAttendance = async () => {
    if (!date || !selectedSite) {
      alert("⚠️ Please select a date and site before submitting.");
      return;
    }

    try {
      const res = await axios.post(
        "https://attendance-management-backend-vh2w.onrender.com/api/attendance",
        {
          date,
          site: selectedSite,
          records: workers.map((w) => ({
            workerId: w.workerId,
            name: w.name,
            roleType: w.roleType,
            role: w.role,
            status: w.status,
          })),
        }
      );

      alert(res.data.message || "✅ Attendance saved successfully!");

      
      setTimeout(() => {
        setWorkers([]);
        setDate("");
        setSelectedSite(user.role === "manager" ? user.site : "");
      }, 1000);
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
          style={{ padding: "8px 12px", margin: "10px 0" }}
        />
      </label>

 
      {user?.role === "admin" && (
        <label>
          Select Site:{" "}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{ padding: "8px 12px", margin: "10px 0" }}
          >
            <option value="">-- Select Site --</option>
            {sites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}

   
      {workers.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ marginTop: 15, borderCollapse: "collapse", width: "100%" }}
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
          onClick={submitAttendance}
          style={{
            marginTop: 15,
            padding: "10px 20px",
            cursor: "pointer",
            background: "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
          }}
        >
          ✅ Submit Attendance
        </button>
      )}
    </div>
  );
}

export default Attendance;
