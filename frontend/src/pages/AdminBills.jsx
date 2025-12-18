import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔐 Access Control
  if (!user || user.role !== "admin") {
    return <h2 style={{ color: "red" }}>Access Denied</h2>;
  }

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await axios.get(
          "https://attendance-management-backend-vh2w.onrender.com/api/bill"
        );
        setBills(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load bills");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  return (
    <div className="page">
      <h2>All Vendor Bills (Admin)</h2>

      {loading && <p>Loading bills...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && bills.length === 0 && <p>No bills found</p>}

      {!loading && bills.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr style={headerRow}>
              <th style={th}>Work</th>
              <th style={th}>Bill No</th>
              <th style={th}>Site</th>
              <th style={th}>Manager</th>
              <th style={th}>Amount</th>
              <th style={th}>Date</th>
              <th style={th}>Bill File</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id} style={bodyRow}>
                <td style={td}>{b.workName}</td>
                <td style={td}>{b.billNo}</td>
                <td style={td}>{b.site}</td>

                {/* ✅ Manager NAME */}
                <td style={td}>
                  {b.sentTo?.name ? b.sentTo.name : "No Manager"}
                </td>

                <td style={td}>₹ {b.amount}</td>
                <td style={td}>
                  {new Date(b.billDate).toLocaleDateString()}
                </td>
                <td style={td}>
                  {b.billFile ? (
                    <a
                      href={`https://attendance-management-backend-vh2w.onrender.com/uploads/${b.billFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1e88e5" }}
                    >
                      View
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
};

const headerRow = {
  background: "#1f1f1f",
  color: "white",
};

const bodyRow = {
  background: "#2c2c2c",
  color: "white",
  textAlign: "center",
};

const th = {
  padding: "10px",
  border: "1px solid #444",
};

const td = {
  padding: "10px",
  border: "1px solid #444",
};

export default AdminBills;
