import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Access control
  if (!user || user.role !== "admin") {
    return <h2>Access Denied</h2>;
  }

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "https://attendance-management-backend-vh2w.onrender.com/api/bill"
        );
        setBills(res.data);
      } catch (err) {
        console.error("Error fetching bills:", err);
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

      {bills.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Work</th>
              <th>Bill No</th>
              <th>Site</th>
              <th>Manager</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id}>
                <td>{b.workName}</td>
                <td>{b.billNo}</td>
                <td>{b.site}</td>
                <td>{b.sentTo}</td>
                <td>{b.amount}</td>
                <td>{new Date(b.billDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminBills;
