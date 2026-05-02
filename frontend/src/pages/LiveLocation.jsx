import React, { useEffect, useState } from "react";
import API from "../api";
import "../App.css";

function LiveLocation() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const hash = window.location.hash;
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";
  const query = new URLSearchParams(queryString);
  const site = query.get("site");
  const date = query.get("date");

  // ⏱️ TIME AGO CALCULATOR
  const getTimeAgo = (time) => {
    if (!time) return "-";
    const diff = Math.floor((now - new Date(time)) / 1000);

    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)} hr ago`;
  };

  // 🌍 FETCH LIVE LOCATIONS FROM SERVER
  const fetchLocations = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const res = await API.get(`/auth/live-locations`, {
        params: { site, date },
      });

      const updatedLocations = (res.data || []).map((loc) => ({
        ...loc,
        // ⭐ SERVER TIMESTAMP USE KARNA MOST IMPORTANT
        lastUpdate:
          loc.timestamp || loc.lastUpdate || new Date().toISOString(),
      }));

      setLocations(updatedLocations);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(true);

    // 🔁 SERVER POLLING EVERY 10 SEC
    const serverInterval = setInterval(() => {
      fetchLocations(false);
    }, 10000);

    // ⏰ CLOCK EVERY SECOND (for "Updated xx sec ago")
    const clockInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(serverInterval);
      clearInterval(clockInterval);
    };
  }, [site, date]);

  return (
    <div className="workers-container">
      <h2>
        📍 Live Locations ({site || "All"}) {date && `- ${date}`}
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : locations.length === 0 ? (
        <p>No active locations</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Location</th>
              <th>Live Time</th>
              <th>Map</th>
            </tr>
          </thead>

          <tbody>
            {locations.map((loc, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{loc.name || "N/A"}</td>
                <td>{loc.role || "N/A"}</td>
                <td>{loc.locationName || "Unknown"}</td>

                {/* ⭐⭐ FIXED LIVE TIME COLUMN ⭐⭐ */}
                <td>
                  {loc.lastUpdate ? (
                    <>
                      <b>
                        {new Date(loc.lastUpdate).toLocaleTimeString()}
                      </b>
                      <br />
                      <small style={{ color: "#888" }}>
                        Updated {getTimeAgo(loc.lastUpdate)}
                      </small>
                    </>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {loc.latitude && loc.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Map
                    </a>
                  ) : (
                    "No Map"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LiveLocation;
