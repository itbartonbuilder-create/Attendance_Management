import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";

function ReportView() {
  const { date } = useParams();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState({ visible: false, src: "" });
  const location = useLocation();

const queryParams = new URLSearchParams(location.search);
const siteId = queryParams.get("siteId");
  

  const user = JSON.parse(localStorage.getItem("user") || "{}");

useEffect(() => {
  const fetchReport = async () => {
    if (!siteId) {
      console.error("SiteId missing in URL");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `https://attendance-management-backend-vh2w.onrender.com/api/report/${date}`,
        {
          params: {
            siteId: siteId,
            role: user?.role,
          },
        }
      );

      setReports(res.data || []);
    } catch (err) {
      console.error("Report fetch error:", err.response?.data || err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  fetchReport();
}, [date, siteId]);
  const openPreview = (src) =>
    setPreview({ visible: true, src });

  const closePreview = () =>
    setPreview({ visible: false, src: "" });

  const renderPhotos = (photos, label) => {
    if (!Array.isArray(photos) || photos.length === 0) {
      return <p style={{ color: "gray" }}>No {label} photos</p>;
    }

    return photos.map((url, i) => (
      <img
        key={i}
        src={url}
        alt={`${label}-${i}`}
        style={{
          width: 150,
          height: 110,
          margin: 5,
          borderRadius: 6,
          objectFit: "cover",
          cursor: "pointer",
        }}
        onClick={() => openPreview(url)}
      />
    ));
  };

  if (loading) return <p style={{ padding: 20 }}>Loading report...</p>;

  if (!reports.length)
    return (
      <p style={{ padding: 20 }}>
        No report submitted for <b>{date}</b>
      </p>
    );

  return (
    <div className="view-container">
      <h2>
        📋 Reports for {date}{" "}
        {reports[0] ? `(Site: ${reports[0].siteId})` : ""}
      </h2>

      {reports.map((report) => (
        <div key={report._id} style={{ marginBottom: 40 }}>
          {/* Morning */}
          <section style={{ marginBottom: 30 }}>
            <h2>🌅 Morning Update</h2>

            {report.morningText ? (
              <p>{report.morningText}</p>
            ) : (
              <p style={{ color: "gray" }}>
                No morning report submitted
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {renderPhotos(report.morningPhotos, "morning")}
            </div>
          </section>

          {/* Evening */}
          <section>
            <h2>🌇 Evening Update</h2>

            {report.eveningText ? (
              <p>{report.eveningText}</p>
            ) : (
              <p style={{ color: "gray" }}>
                No evening report submitted
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {renderPhotos(report.eveningPhotos, "evening")}
            </div>
          </section>
        </div>
      ))}

      {/* Preview Modal */}
      {preview.visible && (
        <div
          onClick={closePreview}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            cursor: "zoom-out",
          }}
        >
          <img
            src={preview.src}
            alt="preview"
            style={{
              maxHeight: "90%",
              maxWidth: "90%",
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ReportView;
