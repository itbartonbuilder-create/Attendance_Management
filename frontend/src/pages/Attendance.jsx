import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Attendance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recordType, setRecordType] = useState("worker"); // worker or employee
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [noPeopleFound, setNoPeopleFound] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Cache attendance per site + type + date
  const [attendanceCache, setAttendanceCache] = useState({});
  const [records, setRecords] = useState([]);

  const BASE_API = "https://attendance-management-backend-vh2w.onrender.com/api";

  // --- Load user and sites ---
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(savedUser);
    setUser(u);

    if (u.role === "worker") {
      alert("❌ Access denied for workers.");
      navigate("/dashboard");
    }

    const fetchSites = async () => {
      try {
        const [resWorkers, resEmployees] = await Promise.all([
          axios.get(`${BASE_API}/workers`),
          axios.get(`${BASE_API}/employees`)
        ]);
        const allSites = new Set();
        resWorkers.data.forEach(w => allSites.add(w.site));
        resEmployees.data.forEach(e => allSites.add(e.site));
        setSites(Array.from(allSites));
        if (u.role === "manager") setSelectedSite(u.site);
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };
    fetchSites();
  }, [navigate]);

  // --- Fetch records by type and site ---
  const fetchRecordsByTypeAndSite = async (type, site) => {
    if (!site) return;
    try {
      const url = type === "worker" ? `${BASE_API}/workers` : `${BASE_API}/employees`;
      const res = await axios.get(url);

 const filteredPeople = res.data.filter(p => p.site === site);

if (filteredPeople.length === 0) {
  setRecords([]);
  setNoPeopleFound(true);
  return;
}

setNoPeopleFound(false);

const filtered = filteredPeople.map(p => ({
  id: p._id,
  name: p.name,
  roleType: p.roleType || "Employee",
  role: p.role || "N/A",
  perDaySalary: Number(p.perDaySalary || p.salary) || 0,
  status: "",
  isFullDay: false,
  overtimeHours: 0,
  totalHours: 0,
  salary: 0,
  leaveType: { holiday: false, accepted: false },
}));


      const cacheKey = `${site}-${type}-${date}`;
      const cached = attendanceCache[cacheKey] || [];
      const merged = filtered.map(f => cached.find(c => c.id === f.id) || f);

      const withSrNo = merged.map((r, i) => ({ ...r, srNo: i + 1 }));
      setRecords(withSrNo);
    } catch (err) {
      console.error("Error fetching records:", err);
      setRecords([]);
    }
  };

  // --- Fetch existing attendance from backend ---
  const fetchExistingAttendance = async (site, selectedDate, type) => {
    if (!site || !selectedDate) return;
    try {
      const res = await axios.get(`${BASE_API}/attendance/get`, {
        params: { date: selectedDate, site, type }
      });
      const cacheKey = `${site}-${type}-${selectedDate}`;

      if (res.data?.records?.length > 0) {
        const formatted = res.data.records.map((r, i) => ({
          id: r.workerId,
          name: r.name,
          roleType: r.roleType,
          role: r.role,
          perDaySalary: r.salary / (r.hoursWorked || 8),
          status: r.status,
          isFullDay: r.status === "Present" ? r.hoursWorked >= 8 : r.status === "Leave",
          overtimeHours: r.overtimeHours || 0,
          totalHours: r.hoursWorked || 0,
          salary: r.salary || 0,
          leaveType: r.leaveType || { holiday: false, accepted: false },
        }));

        // Update cache separately for worker/employee
        setAttendanceCache(prev => ({ ...prev, [cacheKey]: formatted }));

        const withSrNo = formatted.map((r, i) => ({ ...r, srNo: i + 1 }));
        setRecords(withSrNo);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  // --- Update records whenever site, date, or type changes ---
  useEffect(() => {
    if (!selectedSite) return;

    const cacheKey = `${selectedSite}-${recordType}-${date}`;
    if (attendanceCache[cacheKey]) {
      const cached = attendanceCache[cacheKey].map((r, i) => ({ ...r, srNo: i + 1 }));
      setRecords(cached);
    } else {
      fetchRecordsByTypeAndSite(recordType, selectedSite);
      fetchExistingAttendance(selectedSite, date, recordType);
    }
  }, [selectedSite, date, recordType]);

  // --- Handlers ---
  const handleStatusChange = (id, status) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        const resetLeave = { holiday: false, accepted: false };
        if (status === "Present") return { ...r, status, isFullDay: true, totalHours: 8, salary: r.perDaySalary, overtimeHours: 0, leaveType: resetLeave };
        if (status === "Absent") return { ...r, status, isFullDay: false, totalHours: 0, salary: 0, overtimeHours: 0, leaveType: resetLeave };
        if (status === "Leave") return { ...r, status, isFullDay: false, totalHours: 0, salary: 0, overtimeHours: 0, leaveType: resetLeave };
        return r;
      })
    );
  };

  const handleFullDayToggle = (id, checked) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id === id) {
          const total = (checked ? 8 : 0) + r.overtimeHours;
          const salary = Math.round((r.perDaySalary / 8) * total);
          return { ...r, isFullDay: checked, totalHours: total, salary };
        }
        return r;
      })
    );
  };

  const handleOvertimeChange = (id, hours) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id === id) {
          const h = Math.max(0, Math.min(12, hours));
          const total = (r.isFullDay ? 8 : 0) + h;
          const salary = Math.round((r.perDaySalary / 8) * total);
          return { ...r, overtimeHours: h, totalHours: total, salary };
        }
        return r;
      })
    );
  };

  const handleLeaveTypeChange = (id, type, checked) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updatedLeave = { ...r.leaveType, [type]: checked };
          const isPaidLeave = updatedLeave.holiday || updatedLeave.accepted;
          const total = isPaidLeave ? 8 : 0;
          const salary = isPaidLeave ? r.perDaySalary : 0;
          return { ...r, leaveType: updatedLeave, totalHours: total, salary };
        }
        return r;
      })
    );
  };

  // --- Submit attendance separately per type ---
  const submitAttendance = async () => {
    if (!date || !selectedSite) {
      alert("⚠️ Please select date & site!");
      return;
    }
    try {
      const payload = {
        date,
        site: selectedSite,
        type: recordType,
        records: records.map(r => ({
          workerId: r.id,
          name: r.name,
          roleType: r.roleType,
          role: r.role,
          status: r.status,
          hoursWorked: r.totalHours,
          overtimeHours: r.overtimeHours,
          salary: r.salary,
          leaveType: r.leaveType
        }))
      };
      await axios.post(`${BASE_API}/attendance`, payload);
      alert(`✅ ${recordType.toUpperCase()} attendance saved successfully!`);

      // Update cache separately for worker/employee
      const cacheKey = `${selectedSite}-${recordType}-${date}`;
      setAttendanceCache(prev => ({ ...prev, [cacheKey]: records }));
    } catch (err) {
      console.error(err);
      alert("❌ Error saving attendance.");
    }
  };

  return (
    <div className="attendance-container">
      <h2>📝 Mark Attendance</h2>

      <label>
        Select Type:{" "}
        <select value={recordType} onChange={e => setRecordType(e.target.value)} style={{ padding: "8px 12px", margin: "10px 0" }}>
          <option value="worker">Worker</option>
          <option value="employee">Employee</option>
        </select>
      </label>

      <label>
        Select Date:{" "}
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: "8px 12px", margin: "10px 0" }} />
      </label>

      {user?.role === "admin" && (
        <label>
          Select Site:{" "}
          <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} style={{ padding: "8px 12px", margin: "10px 0" }}>
            <option value="">-- Select Site --</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}
       {selectedSite && noPeopleFound && (
        <div style={{ marginTop: 20, color: "red", fontWeight: "bold" }}>
         No {recordType} records are available for the selected site.
        </div>
      )}

      {records.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center", marginTop: "15px" }}>
          <thead style={{ background: "#2C3E50", color: "white" }}>
            <tr>
              <th>Sr No.</th>
              <th>Name</th>
              <th>Role Type</th>
              <th>Sub Role</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Leave</th>
              <th>Holiday</th>
              <th>Leave Accepted</th>
              <th>Full Day</th>
              <th>Overtime</th>
              <th>Total Hours</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.srNo}</td>
                <td>{r.name}</td>
                <td>{r.roleType}</td>
                <td>{r.role}</td>
                <td><input type="radio" name={`status-${r.id}`} checked={r.status === "Present"} onChange={() => handleStatusChange(r.id, "Present")} /></td>
                <td><input type="radio" name={`status-${r.id}`} checked={r.status === "Absent"} onChange={() => handleStatusChange(r.id, "Absent")} /></td>
                <td><input type="radio" name={`status-${r.id}`} checked={r.status === "Leave"} onChange={() => handleStatusChange(r.id, "Leave")} /></td>
                <td>{r.status === "Leave" && <input type="checkbox" checked={r.leaveType.holiday} onChange={e => handleLeaveTypeChange(r.id, "holiday", e.target.checked)} />}</td>
                <td>{r.status === "Leave" && <input type="checkbox" checked={r.leaveType.accepted} onChange={e => handleLeaveTypeChange(r.id, "accepted", e.target.checked)} />}</td>
                <td>{r.status === "Present" && <input type="checkbox" checked={r.isFullDay} onChange={e => handleFullDayToggle(r.id, e.target.checked)} />}</td>
                <td>{r.status === "Present" && <input type="number" min="0" max="12" value={r.overtimeHours} onChange={e => handleOvertimeChange(r.id, Number(e.target.value))} style={{ width: "60px" }} />}</td>
                <td>{r.totalHours || "-"}</td>
                <td>{r.salary ? `₹${r.salary}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {records.length > 0 && (
        <button onClick={submitAttendance} style={{ marginTop: 15, padding: "10px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: 8 }}>
          ✅ Submit Attendance
        </button>
      )}
    </div>
  );
}

export default Attendance;
