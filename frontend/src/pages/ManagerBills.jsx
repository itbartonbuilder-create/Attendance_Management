import React, { useEffect, useState } from "react";
import axios from "axios";

const ManagerBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!user || user.role !== "manager") {
    return <h2 style={{ padding: 40 }}>Access Denied</h2>;
  }

  // ================= FETCH =================
  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill",
        {
          params: {
            role: "manager",
            userId: user._id,
            site: user.site,
          },
        }
      );
      setBills(res.data);
    } catch (err) {
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // ================= APPROVE / REJECT =================
  const updateStatus = async (billId, status) => {
    if (!window.confirm(`Are you sure to ${status} this bill?`)) return;

    try {
      await axios.put(
        `https://attendance-management-backend-vh2w.onrender.com/api/bill/${billId}/status`,
        { status }
      );

      setBills((prev) =>
        prev.map((b) =>
          b._id === billId ? { ...b, status } : b
        )
      );
    } catch (err) {
      alert("Status update failed");
    }
  };

  return (
    <div style={page}>
      <h2>{user.site} Site Bills (Manager)</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {bills.length > 0 && (
        <table style={table}>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Work</th>
              <th>Bill No</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Bill</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id}>
                <td>{b.vendor?.name}</td>
                <td>{b.workName}</td>
                <td>{b.billNo}</td>
                <td>₹{b.amount}</td>
                <td>{new Date(b.billDate).toLocaleDateString()}</td>
                <td style={{
                  fontWeight: "bold",
                  color:
                    b.status === "approved"
                      ? "green"
                      : b.status === "rejected"
                      ? "red"
                      : "orange",
                }}>
                  {b.status}
                </td>
                <td>
                  <a href={b.billFile} target="_blank" rel="noreferrer">
                    View
                  </a>
                </td>
                <td>
                  {b.status === "pending" ? (
                    <>
                      <button
                        style={approveBtn}
                        onClick={() => updateStatus(b._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        style={rejectBtn}
                        onClick={() => updateStatus(b._id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
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
};

/* ========== STYLES ========== */
const page = { 
  padding: "90px 40px" 
};
const table = {
  width: "100%",
  marginTop: 20,
  borderCollapse: "collapse" 
  };
const approveBtn = { 
  background: "green", 
  color: "white", 
  marginRight: 6 };
const rejectBtn = { 
  background: "red",
   color: "white" };

export default ManagerBills;
