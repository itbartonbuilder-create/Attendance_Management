import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate } from "react-router-dom";
import "../App.css";
import axios from "axios";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [userSite, setUserSite] = useState("");
  const [date, setDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [showReportChoice, setShowReportChoice] = useState(false);
  const [showManagementChoice, setShowManagementChoice] = useState(false); 
  const [selectedDate, setSelectedDate] = useState("");
  const [attendanceExists, setAttendanceExists] = useState(false);

  const [reportExists, setReportExists] = useState({
    morning: false,
    evening: false,
  });

  const [taskExists, setTaskExists] = useState(false);

  const [allSites, setAllSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  const BASE_API =
    "https://attendance-management-backend-vh2w.onrender.com/api";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;

    const userObj = JSON.parse(savedUser);

    setUser(userObj);
    setUserSite(userObj.siteId || "");
    setSelectedSite(userObj.siteId || "");
    setIsAdmin(userObj.role === "admin");

    if (userObj.role === "admin") fetchAllSites();
  }, []);

  const fetchAllSites = async () => {
    try {
      const res = await axios.get(`${BASE_API}/sites`);
      setAllSites(res.data || []);
    } catch (err) {
      console.error("Fetch sites error:", err);
    }
  };

  const handleDateClick = async (selected) => {
    const formatted = selected.toLocaleDateString("en-CA");
    setSelectedDate(formatted);

    const siteToUse = isAdmin ? selectedSite : userSite;

    if (!siteToUse) {
      alert("⚠️ Please select a site");
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_API}/check-data/${formatted}`,
        { params: { siteId: siteToUse } }
      );

      setAttendanceExists(res.data.attendanceExists || false);

      setReportExists({
        morning: res.data.morningExists || false,
        evening: res.data.eveningExists || false,
      });

      const taskRes = await axios.get(
        `${BASE_API}/tasks/by-date/${formatted}`,
        { params: { site: siteToUse } }
      );

      setTaskExists(taskRes.data.length > 0);

      setShowModal(true);
    } catch (err) {
      console.error("Check data error:", err);
    }
  };

  const goToAttendance = () =>
    navigate(
      `/attendance/${selectedDate}?site=${
        isAdmin ? selectedSite : userSite
      }`
    );

  const viewAttendance = () =>
    navigate(
      `/attendance-view/${selectedDate}?site=${
        isAdmin ? selectedSite : userSite
      }`
    );

  const viewReport = () =>
    navigate(
      `/report-view/${selectedDate}?siteId=${
        isAdmin ? selectedSite : userSite
      }`
    );

  const addTask = () =>
    navigate(
      `/task/${selectedDate}?site=${
        isAdmin ? selectedSite : userSite
      }`
    );

  const viewTask = () =>
    navigate(
      `/task/${selectedDate}?site=${
        isAdmin ? selectedSite : userSite
      }`
    );

  if (!user) return <h2 style={{ padding: 20 }}>Not Authorized</h2>;

  return (
    <div className="dashboard calendar-dashboard">
      <div className="calendar-card">
        <h2 className="calendar-title">📅 Daily Work Calendar</h2>

        {isAdmin && (
          <div style={{ marginBottom: 15 }}>
            <label>
              Select Site:{" "}
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">--Select Site--</option>

                {allSites.map((s) => (
                  <option key={s._id} value={s.siteId}>
                    {s.name} ({s.siteId})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <Calendar
          onChange={setDate}
          value={date}
          onClickDay={handleDateClick}
        />
      </div>

      {/* ================= MAIN MODAL ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Select Action ({selectedDate})</h3>

            {attendanceExists ? (
              <button
                className="modal-btn view"
                onClick={viewAttendance}
              >
                👁 View Attendance
              </button>
            ) : (
              <button
                className="modal-btn attendance"
                onClick={goToAttendance}
              >
                ➕ Add Attendance
              </button>
            )}

            <button
              className="modal-btn report"
              onClick={() => setShowReportChoice(true)}
            >
              ➕ Add Daily Report
            </button>

            {isAdmin && (
              <button
                className="modal-btn attendance"
                onClick={addTask}
              >
                ➕ Add Task
              </button>
            )}

            {!isAdmin && taskExists && (
              <button
                className="modal-btn view"
                onClick={viewTask}
              >
                👁 View Tasks
              </button>
            )}

            {(user.role === "admin" || user.role === "manager") && (
              <button
                className="modal-btn report"
                onClick={() => setShowManagementChoice(true)}
              >
                🏢 Management
              </button>
            )}

            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= REPORT MODAL ================= */}
      {showReportChoice && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Choose Report Type ({selectedDate})</h3>

            <button
              className="modal-btn report"
              disabled={reportExists.morning}
              onClick={() =>
                navigate(
                  `/daily-report/${selectedDate}/morning${
                    isAdmin ? `?siteId=${selectedSite}` : ""
                  }`
                )
              }
            >
              🌅 Morning Report{" "}
              {reportExists.morning && "(Submitted)"}
            </button>

            <button
              className="modal-btn report"
              disabled={reportExists.evening}
              onClick={() =>
                navigate(
                  `/daily-report/${selectedDate}/evening${
                    isAdmin ? `?siteId=${selectedSite}` : ""
                  }`
                )
              }
            >
              🌇 Evening Report{" "}
              {reportExists.evening && "(Submitted)"}
            </button>

            {(reportExists.morning || reportExists.evening) && (
              <button
                className="modal-btn view"
                onClick={viewReport}
              >
                👁 View Report
              </button>
            )}

            <button
              className="modal-close"
              onClick={() => setShowReportChoice(false)}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ================= MANAGEMENT MODAL ================= */}
      {showManagementChoice && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Management Options</h3>

            {user.role === "admin" && (
              <>
                <button
                  className="modal-btn"
                 onClick={() =>
  navigate(`/admin/bills?siteId=${selectedSite}`)
}
                >
                  Bills
                </button>

                <button
                  className="modal-btn"
                  onClick={() => navigate("/admin/stock")}
                >
                  Stockmanagement
                </button>

                <button
                  className="modal-btn"
                  onClick={() => navigate("/vendors")}
                >
                  Vendors
                </button>
                 {/* <button
      className="modal-btn"
      onClick={() =>
        navigate(`/site-expense?siteId=${selectedSite}`)
      }
    >
      Site Expense
    </button> */}
              </>
            )}

            {user.role === "manager" && (
              <>
                <button
                  className="modal-btn"
                  onClick={() => navigate("/manager/bills")}
                >
                  Bills
                </button>

                <button
                  className="modal-btn"
                  onClick={() => navigate("/stock")}
                >
                  Stockmanagement
                </button>
                {/* <button
                   className="modal-btn"
                   onClick={()=>navigate("/site-expense")}
                 >
                  Site Expense
                </button> */}
              </>
            )}

            <button
              className="modal-close"
              onClick={() => setShowManagementChoice(false)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
