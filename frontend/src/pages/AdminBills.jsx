import { useEffect, useState } from "react";
import axios from "axios";

const AdminBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!user || user.role !== "admin") {
    return <h2 style={{ color: "white" }}>Access Denied</h2>;
  }

  // 🔹 Fetch all bills (Admin)
  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill",
        { params: { role: "admin" } }
      );
      setBills(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // 🔹 Approve / Reject handler
  const changeStatus = async (billId, status) => {
    const confirmMsg =
      status === "approved"
        ? "Approve this bill?"
        : "Reject this bill?";

    if (!window.confirm(confirmMsg)) return;

    try {
     await axios.put(
  `https://attendance-management-backend-vh2w.onrender.com/api/bill/${billId}/status`,
  { status }
);

      // ✅ Update UI instantly
      setBills((prev) =>
        prev.map((b) =>
          b._id === billId ? { ...b, status } : b
        )
      );
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update bill status");
    }
  };

  return (
    <div style={{ padding: "100px 30px", color: "white" }}>
      <h2>All Vendor Bills (Admin)</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && bills.length === 0 && <p>No bills found</p>}

      {!loading && bills.length > 0 && (
        <table
          style={{
            width: "100%",
            marginTop: 20,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#2c3e50" }}>
              <th style={th}>Vendor</th>
              <th style={th}>Company</th>
              <th style={th}>Work</th>
              <th style={th}>Bill No</th>
              <th style={th}>Site</th>
              <th style={th}>Amount</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              <th style={th}>Bill</th>
              <th style={th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {bills.map((b) => (
              <tr key={b._id} style={{ borderBottom: "1px solid #444" }}>
                <td style={td}>{b.vendor?.name || "-"}</td>
                <td style={td}>{b.vendor?.companyName || "-"}</td>
                <td style={td}>{b.workName}</td>
                <td style={td}>{b.billNo}</td>
                <td style={td}>{b.site}</td>
                <td style={td}>₹{b.amount}</td>
                <td style={td}>
                  {new Date(b.billDate).toLocaleDateString()}
                </td>

                <td
                  style={{
                    ...td,
                    fontWeight: 600,
                    color:
                      b.status === "approved"
                        ? "lightgreen"
                        : b.status === "rejected"
                        ? "salmon"
                        : "orange",
                    textTransform: "capitalize",
                  }}
                >
                  {b.status || "pending"}
                </td>

                <td style={td}>
                  <a
                    href={b.billFile}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#4da6ff" }}
                  >
                    View
                  </a>
                </td>

                <td style={td}>
                  {b.status === "pending" || !b.status ? (
                    <>
                      <button
                        style={approveBtn}
                        onClick={() =>
                          changeStatus(b._id, "approved")
                        }
                      >
                        Approve
                      </button>

                      <button
                        style={rejectBtn}
                        onClick={() =>
                          changeStatus(b._id, "rejected")
                        }
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

/* ================= STYLES ================= */

const th = {
  padding: "10px",
  textAlign: "left",
};

const td = {
  padding: "10px",
};

const approveBtn = {
  background: "green",
  color: "white",
  border: "none",
  padding: "6px 10px",
  marginRight: "6px",
  borderRadius: "4px",
  cursor: "pointer",
};

const rejectBtn = {
  background: "crimson",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
};

export default AdminBills;
