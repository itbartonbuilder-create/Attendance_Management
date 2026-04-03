import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import API from "../api";
import { Capacitor } from "@capacitor/core";  
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
import { startTracking } from "../backgroundTracking"; 

function WorkCalendar() {
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
  const [isAccountant, setIsAccountant] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const fetchDataForDate = async (dateToCheck) => {
  if (!dateToCheck) return;

  const siteToUse = isAdmin ? selectedSite : userSite;
  if (!siteToUse) return;

  try {
    const res = await API.get(`/check-data/${dateToCheck}`, {
      params: { siteId: siteToUse },
    });

    setAttendanceExists(res.data.attendanceExists || false);
    setReportExists({
      morning: res.data.morningExists || false,
      evening: res.data.eveningExists || false,
    });

    const taskRes = await API.get(`/tasks/by-date/${dateToCheck}`, {
      params: { site: siteToUse },
    });

    setTaskExists(taskRes.data.length > 0);
  } catch (err) {
    console.error("Fetch data error:", err);
  }
};


  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;

    const userObj = JSON.parse(savedUser);

    setUser(userObj);
    setUserSite(userObj.siteId || "");
    setSelectedSite(userObj.siteId || "");
     const adminUser = userObj.role === "admin";
    const accountantUser = userObj.role === "accountant";

     setIsAdmin(adminUser);
  setIsAccountant(accountantUser);

    if (adminUser || accountantUser) fetchAllSites();
  }, []);

useEffect(() => {
  const initTracking = async () => {
    try {
      if (!Capacitor.isNativePlatform()) return;

      console.log(" Checking permission");

      const status = await BackgroundGeolocation.requestPermission();
      console.log("Permission:", status);

      if (status !== BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS) {
        alert("Please enable 'Allow all the time' in settings");
        BackgroundGeolocation.showAppSettings();
        return;
      }

      await startTracking();
      const loc = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: true,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      });

     const user = JSON.parse(localStorage.getItem("user"));

await API.post("/update-location", {
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
  userId: user._id,
  role: user.role,
});

      console.log("📡 App open location synced");

    } catch (err) {
      console.log("❌ Tracking error:", err);
    }
  };

  initTracking();
}, []);

useEffect(() => {
  const params = new URLSearchParams(location.search);

  const dateParam = params.get("date");
  const modalParam = params.get("modal");
  const siteParam = params.get("site");

  if (siteParam) {
    setSelectedSite(siteParam);
  }

  if (dateParam) {
    setSelectedDate(dateParam);
    setShowModal(true);

    setShowReportChoice(modalParam === "report");
    setShowManagementChoice(modalParam === "management");
  } else {
    setShowModal(false);
    setShowReportChoice(false);
    setShowManagementChoice(false);
  }
}, [location.search]);

useEffect(() => {
  fetchDataForDate(selectedDate);
}, [selectedDate, selectedSite]);
  const fetchAllSites = async () => {
    try {
      const res = await API.get(`/sites`);
      setAllSites(res.data || []);
    } catch (err) {
      console.error("Fetch sites error:", err);
    }
  };

const handleDateClick = (selected) => {
  const formatted = selected.toLocaleDateString("en-CA");

  if ((isAdmin || isAccountant) && !selectedSite) {
    alert("Please select a site first");
    return;
  }

  setSelectedDate(formatted);
  if (isAccountant) {
    navigate(`/work-calendar?date=${formatted}&site=${selectedSite}&modal=management`);
    return;
  }

  navigate(`/work-calendar?date=${formatted}&site=${isAdmin ? selectedSite : userSite}`);
  fetchDataForDate(formatted);
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

        {(isAdmin || isAccountant)  && (
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

      {showModal && !isAccountant && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Select Action ({selectedDate})</h3>
        {isAdmin && (
          <button className="modal-btn view" onClick={() =>
              navigate(`/live-location?site=${selectedSite}`)}>
             Live Location </button> )}

            {attendanceExists ? (
              <button className="modal-btn view" onClick={viewAttendance}>
                👁 View Attendance
              </button>
            ) : (
              <button className="modal-btn attendance" onClick={goToAttendance}>
                ➕ Add Attendance
              </button>
            )}

            <button
              className="modal-btn report"
             onClick={() =>navigate(`/work-calendar?date=${selectedDate}&site=${selectedSite}&modal=report`)
            }>
              ➕ Add Daily Report
            </button>

            {isAdmin && (
              <button className="modal-btn attendance" onClick={addTask}>
                ➕ Add Task
              </button>
            )}

            {!isAdmin && taskExists && (
              <button className="modal-btn view" onClick={viewTask}>
                👁 View Tasks
              </button>
            )}

            {(user.role === "admin" || user.role === "manager" || user.role === "accountant" ) && (
              <button
                className="modal-btn report"
               onClick={() =>
                navigate( `/work-calendar?date=${selectedDate}&site=${selectedSite}&modal=management`)
                }
              >
                 Management
              </button>
            )}

            <button
              className="modal-close"
              onClick={() => navigate("/work-calendar")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
               Morning Report {reportExists.morning && "(Submitted)"}
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
               Evening Report {reportExists.evening && "(Submitted)"}
            </button>

            {(reportExists.morning || reportExists.evening) && (
              <button className="modal-btn view" onClick={viewReport}>
                👁 View Report
              </button>
            )}

            <button
              className="modal-close"
              onClick={() =>
  navigate(`/work-calendar?date=${selectedDate}&site=${selectedSite}`)
}
            >
              Back
            </button>
          </div>
        </div>
      )}

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
              </>
            )}
{user.role === "accountant" && (
  <>
    <button
      className="modal-btn"
      onClick={() =>
        navigate(`/admin/bills?siteId=${selectedSite}`)
      }
    >
      Bills
    </button>
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
              </>
            )}

            <button
              className="modal-close"
              onClick={() =>
               navigate(`/work-calendar?date=${selectedDate}&site=${selectedSite}`)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkCalendar;
