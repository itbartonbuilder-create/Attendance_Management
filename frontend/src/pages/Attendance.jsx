import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Attendance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recordType, setRecordType] = useState("worker"); // "worker" or "employee"
  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);
  const [selectedSite, setSelectedSite] = useState("");
  const [records, setRecords] = useState([]); // either workers or employees
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // ✅ Load user & access check
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

  // ✅ Fetch data based on recordType
  const fetchRecordsBySite = async (site) => {
    if (!site || !recordType) return;
    try {
      let url = "";
      if (recordType === "worker") {
        url = "https://attendance-management-backend-vh2w.onrender.com/api/workers";
      } else if (recordType === "employee") {
        url = "https://attendance-management-backend-vh2w.onrender.com/api/employees";
      }

      const res = await axios.get(url);
      let data = res.data;

      // Manager: only their site
      if (user.role === "manager") data = data.filter((w) => w.site === user.site);
      else if (site) data = data.filter((w) => w.site === site);

      // Map to attendance format
      const formatted = data.map((w, i) => ({
        srNo: i + 1,
        id: w._id,
        name: w.name,
        roleType: w.roleType || "Employee",
        role: w.role || "N/A",
        perDaySalary: Number(w.perDaySalary || w.salary) || 0,
        status: "",
        isFullDay: false,
        overtimeHours: 0,
        totalHours: 0,
        salary: 0,
        leaveType: { holiday: false, accepted: false },
      }));

      setRecords(formatted);
    } catch (err) {
      console.error("Error fetching records:", err);
      alert("❌ Error fetching data.");
    }
  };

  // ✅ Fetch existing attendance
  const fetchExistingAttendance = async (site, selectedDate) => {
    if (!site || !selectedDate) return;
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/attendance/get",
        { params: { date: selectedDate, site, type: recordType } }
      );

      if (res.data?.records?.length > 0) {
        setRecords((prev) =>
          prev.map((r) => {
            const match = res.data.records.find((a) => a.workerId === r.id);
            if (!match) return r;

            const leaveType = match.leaveType || { holiday: false, accepted: false };
            const isPaidLeave = leaveType.holiday || leaveType.accepted;

            let totalHours = match.hoursWorked || 0;
            let salary = match.salary || 0;

            if (match.status === "Leave" && isPaidLeave) {
              totalHours = 8;
              salary = r.perDaySalary;
            }

            const overtime =
              match.overtimeHours || (match.hoursWorked > 8 ? match.hoursWorked - 8 : 0);

            return {
              ...r,
              status: match.status,
              isFullDay: match.hoursWorked >= 8,
              overtimeHours: overtime,
              totalHours,
              salary,
              leaveType,
            };
          })
        );
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  // ✅ Update when recordType, site or date changes
  useEffect(() => {
    if (!selectedSite || !user) return;
    (async () => {
      await fetchRecordsBySite(selectedSite);
      await fetchExistingAttendance(selectedSite, date);
    })();
  }, [selectedSite, date, user, recordType]);

  // ✅ Handle status change
  const handleStatusChange = (id, status) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const resetLeave = { holiday: false, accepted: false };

        if (status === "Present") {
          return { ...r, status, isFullDay: true, overtimeHours: 0, totalHours: 8, salary: r.perDaySalary, leaveType: resetLeave };
        }
        if (status === "Absent") {
          return { ...r, status, isFullDay: false, overtimeHours: 0, totalHours: 0, salary: 0, leaveType: resetLeave };
        }
        if (status === "Leave") {
          return { ...r, status, isFullDay: false, overtimeHours: 0, totalHours: 0, salary: 0, leaveType: resetLeave };
        }
        return r;
      })
    );
  };

  // ✅ Full day toggle
  const handleFullDayToggle = (id, checked) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const total = (checked ? 8 : 0) + r.overtimeHours;
          const salary = Math.round((r.perDaySalary / 8) * total);
          return { ...r, isFullDay: checked, totalHours: total, salary };
        }
        return r;
      })
    );
  };

  // ✅ Overtime input
  const handleOvertimeChange = (id, hours) => {
    setRecords((prev) =>
      prev.map((r) => {
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

  // ✅ Holiday / Accepted Leave toggle
  const handleLeaveTypeChange = (id, type, checked) => {
    setRecords((prev) =>
      prev.map((r) => {
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

  // ✅ Submit attendance
  const submitAttendance = async () => {
    if (!date || !selectedSite) {
      alert("⚠️ Please select date & site!");
      return;
    }

    try {
      await axios.post(
        "https://attendance-management-backend-vh2w.onrender.com/api/attendance",
        {
          date,
          site: selectedSite,
          type: recordType,
          records: records.map((r) => ({
            workerId: r.id,
            name: r.name,
            roleType: r.roleType,
            role: r.role,
            status: r.status,
            hoursWorked: r.totalHours,
            overtimeHours: r.overtimeHours,
            salary: r.salary,
            leaveType: r.leaveType,
          })),
        }
      );
      alert("✅ Attendance saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving attendance.");
    }
  };

  return (
    <div className="attendance-container">
      <h2>📝 Mark Attendance</h2>

      {/* Type Selection */}
      <label>
        Select Type:{" "}
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          style={{ padding: "8px 12px", margin: "10px 0" }}
        >
          <option value="worker">Worker</option>
          <option value="employee">Employee</option>
        </select>
      </label>

      {/* Date & Site */}
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

      {/* Attendance Table */}
      {records.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: "100%", textAlign: "center" }}>
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
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.srNo}</td>
                <td>{r.name}</td>
                <td>{r.roleType}</td>
                <td>{r.role}</td>
                <td>
                  <input
                    type="radio"
                    name={`status-${r.id}`}
                    checked={r.status === "Present"}
                    onChange={() => handleStatusChange(r.id, "Present")}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    name={`status-${r.id}`}
                    checked={r.status === "Absent"}
                    onChange={() => handleStatusChange(r.id, "Absent")}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    name={`status-${r.id}`}
                    checked={r.status === "Leave"}
                    onChange={() => handleStatusChange(r.id, "Leave")}
                  />
                </td>
                <td>
                  {r.status === "Leave" && (
                    <input
                      type="checkbox"
                      checked={r.leaveType.holiday}
                      onChange={(e) => handleLeaveTypeChange(r.id, "holiday", e.target.checked)}
                    />
                  )}
                </td>
                <td>
                  {r.status === "Leave" && (
                    <input
                      type="checkbox"
                      checked={r.leaveType.accepted}
                      onChange={(e) =>
                        handleLeaveTypeChange(r.id, "accepted", e.target.checked)
                      }
                    />
                  )}
                </td>
                <td>
                  {r.status === "Present" && (
                    <input
                      type="checkbox"
                      checked={r.isFullDay}
                      onChange={(e) => handleFullDayToggle(r.id, e.target.checked)}
                    />
                  )}
                </td>
                <td>
                  {r.status === "Present" && (
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={r.overtimeHours}
                      onChange={(e) => handleOvertimeChange(r.id, Number(e.target.value))}
                      style={{ width: "60px" }}
                    />
                  )}
                </td>
                <td>{r.totalHours || "-"}</td>
                <td>{r.salary ? `₹${r.salary}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {records.length > 0 && (
        <button
          onClick={submitAttendance}
          style={{
            marginTop: 15,
            padding: "10px 20px",
            background: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: 8,
          }}
        >
          ✅ Submit Attendance
        </button>
      )}
    </div>
  );
}

export default Attendance;
