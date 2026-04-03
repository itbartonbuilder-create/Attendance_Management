import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

function Attendance() {
  const navigate = useNavigate();
  const { date: urlDate } = useParams();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [recordType, setRecordType] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [records, setRecords] = useState([]);
  const [locked, setLocked] = useState(false);

  const date = urlDate || new Date().toISOString().split("T")[0];


 
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return navigate("/login");

    const u = JSON.parse(savedUser);
    setUser(u);

    const siteFromURL = searchParams.get("site");
    const siteToUse = u.role === "admin" ? siteFromURL : u.siteId || u.site;
    setSelectedSite(siteToUse);
  }, []);

  useEffect(() => {
    setRecords([]);
    setLocked(false);
  }, [recordType]);

  useEffect(() => {
    if (!selectedSite || !date || !recordType) return;

    const fetchSavedAttendance = async () => {
      try {
        const res = await API.get(`/attendance/get`, {
        params: { date, site: selectedSite, type: recordType },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

        if (res.data.records && res.data.records.length > 0) {
          setRecords(
            res.data.records.map((r) => ({
              workerId: r.workerId,
              name: r.name,
              role: r.role,
              perDaySalary: r.perDaySalary || 0,
              status: r.status,
              leaveType: r.leaveType || { holiday: false, accepted: false },
              isFullDay: r.hoursWorked >= 8,
              overtimeHours: r.overtimeHours || 0,
              hoursWorked: r.hoursWorked || 0,
              salary: r.salary || 0,
            }))
          );
          setLocked(true);
        } else {
          setLocked(false);
        }
      } catch (err) {
        console.log("No saved attendance");
      }
    };

    fetchSavedAttendance();
  }, [selectedSite, date, recordType]);

  // Fetch workers or employees
  useEffect(() => {
    if (!selectedSite || locked || !recordType) return;

    const fetchPeople = async () => {
      try {
        const url = recordType === "worker" ? `/workers` : `/employees`;
        const res = await API.get(url);

        const filtered = res.data.filter((p) => p.site === selectedSite);

        setRecords(
          filtered.map((p) => ({
            workerId: p._id,
            name: p.name,
            role: p.role,
            perDaySalary: p.perDaySalary || p.salary || 0,
            status: "",
            leaveType: { holiday: false, accepted: false },
            isFullDay: false,
            overtimeHours: 0,
            hoursWorked: 0,
            salary: 0,
          }))
        );
      } catch (err) {
        console.log("Error loading people", err);
      }
    };

    fetchPeople();
  }, [selectedSite, recordType, locked]);

  const calculate = (r) => {
    let hours = 0;
    let salary = 0;

    if (r.status === "Present") {
      hours = (r.isFullDay ? 8 : 0) + r.overtimeHours;
      salary = Math.round((r.perDaySalary / 8) * hours);
    }

    if (r.status === "Leave") {
      if (r.leaveType.holiday || r.leaveType.accepted) {
        hours = 8;
        salary = r.perDaySalary;
      }
    }

    return { hours, salary };
  };

  const handleStatus = (id, status) => {
    if (locked) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.workerId !== id) return r;

        const updated = {
          ...r,
          status,
          leaveType: { holiday: false, accepted: false },
          isFullDay: status === "Present",
          overtimeHours: 0,
        };

        const { hours, salary } = calculate(updated);
        return { ...updated, hoursWorked: hours, salary };
      })
    );
  };

  const handleFullDay = (id, checked) => {
    if (locked) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.workerId !== id) return r;
        const updated = { ...r, isFullDay: checked };
        const { hours, salary } = calculate(updated);
        return { ...updated, hoursWorked: hours, salary };
      })
    );
  };

  const handleOvertime = (id, hrs) => {
    if (locked) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.workerId !== id) return r;
        const updated = { ...r, overtimeHours: hrs };
        const { hours, salary } = calculate(updated);
        return { ...updated, hoursWorked: hours, salary };
      })
    );
  };

  const handleLeave = (id, field, value) => {
    if (locked) return;

    setRecords((prev) =>
      prev.map((r) => {
        if (r.workerId !== id) return r;
        const updated = {
          ...r,
          status: "Leave",
          leaveType: { ...r.leaveType, [field]: value },
        };
        const { hours, salary } = calculate(updated);
        return { ...updated, hoursWorked: hours, salary };
      })
    );
  };
  const getLiveLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject("Geolocation not supported");
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => reject(err.message)
    );
  });
};

const submitAttendance = async () => {
  try {
    const coords = await getLiveLocation();

    const geoRes = await API.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
    );

    const address = geoRes.data.display_name;

    await API.post(`/attendance`, {
      date,
      site: selectedSite,
      type: recordType,
      records,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        address,
      },
    });

    setLocked(true);
    alert("✅ Attendance Saved ");
  } catch (err) {
    console.error(err);
    alert("❌ Location required to mark attendance");
  }
};

  const enableEdit = () => setLocked(false);

  if (!user) return null;

  return (
    <div className="attendance-container">
      <h2>📝 Mark Attendance&nbsp;&nbsp;&nbsp;(Site: {selectedSite})</h2>

      <label>
        Select Type:{" "}
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          style={{ padding: "8px 12px", margin: "10px 0" }}
        >
          <option value="" disabled>
            -- Select --
          </option>
          <option value="worker">Worker</option>
          <option value="employee">Employee</option>
        </select>
      </label>

      {recordType && (
        <>
          <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Name</th>
                <th>Role</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Holiday</th>
                <th>Full Day</th>
                <th>OverTime</th>
                <th>Hours</th>
                <th>Salary</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r, i) => (
                <tr key={r.workerId}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.role}</td>

                  <td>
                    <input
                      type="radio"
                      name={`s-${r.workerId}`}
                      checked={r.status === "Present"}
                      disabled={locked}
                      onChange={() => handleStatus(r.workerId, "Present")}
                    />
                  </td>

                  <td>
                    <input
                      type="radio"
                      name={`s-${r.workerId}`}
                      checked={r.status === "Absent"}
                      disabled={locked}
                      onChange={() => handleStatus(r.workerId, "Absent")}
                    />
                  </td>

                  <td>
                    <input
                      type="radio"
                      name={`s-${r.workerId}`}
                      checked={r.status === "Leave"}
                      disabled={locked}
                      onChange={() => handleStatus(r.workerId, "Leave")}
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={r.leaveType.holiday}
                      disabled={locked}
                      onChange={(e) =>
                        handleLeave(r.workerId, "holiday", e.target.checked)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={r.isFullDay}
                      disabled={locked}
                      onChange={(e) =>
                        handleFullDay(r.workerId, e.target.checked)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={r.overtimeHours}
                      disabled={locked}
                      onChange={(e) =>
                        handleOvertime(r.workerId, Number(e.target.value))
                      }
                      style={{ width: 60 }}
                    />
                  </td>

                  <td>{r.hoursWorked}</td>
                  <td>₹{r.salary}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          {!locked ? (
            <button onClick={submitAttendance}>✅ Save Attendance</button>
          ) : (
            <button onClick={enableEdit}>✏️ Edit Attendance</button>
          )}
        </>
      )}
    </div>
  );
}

export default Attendance;
