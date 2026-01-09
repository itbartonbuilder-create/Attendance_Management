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
        `https://attendance-management-backend-vh2w.onrender.com/api/bill/vendor/${user._id}`
      )
      .then((res) => setBills(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <p style={{ color: "white", padding: 20 }}>Loading...</p>;
  }

  return (
    <div style={page}>
      <h2 style={heading}>My Submitted Bills</h2>

      {bills.length === 0 ? (
        <p style={{ color: "#ccc" }}>
          You have not submitted any bills yet.
        </p>
      ) : (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th>Work</th>
                <th>Site</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Bill</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill._id}>
                  <td>{bill.workName}</td>
                  <td>{bill.site}</td>
                  <td>₹ {bill.amount}</td>
                  <td>{bill.billDate?.slice(0, 10)}</td>
                  <td>
                    <span
                      style={{
                        ...statusBadge,
                        background:
                          bill.status === "approved"
                            ? "#2ecc71"
                            : bill.status === "rejected"
                            ? "#e74c3c"
                            : "#f1c40f",
                      }}
                    >
                      {bill.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{bill.approvedBy || "-"}</td>
                  <td>
                    <a
                      href={bill.billFile}
                      target="_blank"
                      rel="noreferrer"
                      style={viewLink}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VendorBills;
