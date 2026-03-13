import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function DailyReport() {
  const { date, type } = useParams();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [exists, setExists] = useState(false);
  const [adminSite, setAdminSite] = useState("");
  const location = useLocation();
const params = new URLSearchParams(location.search);
const siteFromDashboard = params.get("siteId");

  const user = JSON.parse(localStorage.getItem("user"));
const siteId =
  siteFromDashboard ||
  (user?.role === "admin"
    ? adminSite
    : user?.siteId || user?.site || "");


  useEffect(() => {
    if (!siteId) return;

    const check = async () => {
      try {
        const res = await axios.get(
          `https://attendance-management-backend-vh2w.onrender.com/api/check-data/${date}`,
          { params: { siteId } }
        );

        setExists(type === "morning" ? res.data.morningExists : res.data.eveningExists);
      } catch (err) {
        console.error("Check error:", err);
      }
    };

    check();
  }, [date, type, siteId]);

  const handlePhotos = (e) => setPhotos(Array.from(e.target.files));

  const handleSubmit = async () => {
    if (!siteId) return alert("Site not assigned");

    try {
      const formData = new FormData();
      formData.append("date", date);
      formData.append("siteId", siteId);

      if (type === "morning") {
        formData.append("morningText", text || "");
        photos.forEach((file) => formData.append("morningPhotos", file));
      } else {
        formData.append("eveningText", text || "");
        photos.forEach((file) => formData.append("eveningPhotos", file));
      }

      const res = await axios.post(
        "https://attendance-management-backend-vh2w.onrender.com/api/daily-report",
        formData
      );

      console.log(res.data);
      alert("✅ Report Saved");
      navigate("/dashboard");
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err.message);
      alert("❌ Failed to save report");
    }
  };

  return (
    <div style={{ padding: 20, marginTop: 80 }}>
      <h2>{type === "morning" ? "🌅 Morning" : "🌇 Evening"} Report — {date} </h2>
      <h2 style={{ color: "#555" }}> Site: {siteId || "Not Assigned"}</h2>

      {exists ? (
        <>
          <h2 style={{ color: "green" }}>✅ Report Submitted</h2>
          <button
            onClick={() => navigate(`/report-view/${date}`)}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            👁 View Report
          </button>
        </>
      ) : (
        <>
          <input type="file" multiple onChange={handlePhotos} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Work details..."
            style={{ width: "100%", height: 120, marginTop: 10 }}
          />
          <br />
          <br />
          <button
            onClick={handleSubmit}
            style={{
              padding: "12px 25px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            💾 Save Report
          </button>
        </>
      )}
    </div>
  );
}

export default DailyReport;
