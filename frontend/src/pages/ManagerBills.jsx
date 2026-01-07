import React, { useEffect, useState } from "react";
import axios from "axios";

const ManagerBills = () => {
  const user = JSON.parse(localStorage.getItem("user")); // logged-in manager
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Access control: only managers can see this page
  if (!user || user.role !== "manager") return <h2>Access Denied</h2>;

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError(""); // Reset previous errors

      try {
        const response = await axios.get(
          "https://attendance-management-backend-vh2w.onrender.com/api/bill",
          {
            params: {
              role: "manager",
              site: user.site,
              userId: user._id, // ✅ Correct param name for backend
            },
          }
        );

        setBills(response.data);
      } catch (err) {
        console.log("GET request failed:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch bills");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [user.site, user._id]);

  return (
    <div style={page}>
      <h2>{user.site} Site Bills</h2>

      {/* Loading state */}
      {loading && <p>Loading...</p>}

      {/* Error message */}
      {error && !loading && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* No bills found */}
      {!loading && bills.length === 0 && !error && <p>No bills found</p>}

      {/* Bills table */}
      {bills.length > 0 && (
        <table style={table}>
          <thead>
            <tr>
              <th>Work</th>
              <th>Bill No</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Bill</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id}>
                <td>{b.workName}</td>
                <td>{b.billNo}</td>
                <td>₹{b.amount}</td>
                <td>{new Date(b.billDate).toLocaleDateString()}</td>
                <td>
                  <a href={b.billFile} target="_blank" rel="noreferrer">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Styling
const page = { padding: "30px", fontFamily: "Arial, sans-serif" };
const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
};
table.th = table.td = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left",
};

export default ManagerBills;
