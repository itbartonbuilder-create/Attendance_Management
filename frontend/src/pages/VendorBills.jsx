import { useEffect, useState } from "react";
import axios from "axios";

function VendorBills() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill",
        {
          params: {
            role: "vendor",
            userId: user._id,
          },
        }
      )
      .then((res) => {
        setBills(res.data);
      })
      .catch((err) => {
        console.error("❌ Vendor Bills Fetch Error:", err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ padding: "100px 30px", color: "white" }}>
      <h2>My Submitted Bills</h2>

      {loading ? (
        <p style={{ color: "#ccc" }}>Loading bills...</p>
      ) : bills.length === 0 ? (
        <p style={{ color: "#ccc" }}>No bills submitted yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            marginTop: 20,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#2c3e50" }}>
              <th style={thStyle}>Work</th>
              <th style={thStyle}>Site</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Bill</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill._id} style={{ borderBottom: "1px solid #444" }}>
                <td style={tdStyle}>{bill.workName || "-"}</td>
                <td style={tdStyle}>{bill.site || "-"}</td>
                <td style={tdStyle}>₹{bill.amount}</td>
                <td
                  style={{
                    ...tdStyle,
                    color:
                      bill.status === "approved"
                        ? "lightgreen"
                        : bill.status === "rejected"
                        ? "salmon"
                        : "orange",
                    fontWeight: 600,
                  }}
                >
                  {bill.status}
                </td>
                <td style={tdStyle}>
                  {bill.billFile ? (
                    <a
                      href={bill.billFile}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#4da6ff" }}
                    >
                      View
                    </a>
                  ) : (
                    "-"
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

const thStyle = {
  padding: "10px",
  textAlign: "left",
  fontWeight: 600,
};

const tdStyle = {
  padding: "10px",
};

export default VendorBills;
