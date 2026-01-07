import { useEffect, useState } from "react";
import axios from "axios";

const AdminBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!user || user.role !== "admin") {
    return <h2>Access Denied</h2>;
  }

  useEffect(() => {
    axios
      .get(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill",
        { params: { role: "admin" } }   // ⭐ VERY IMPORTANT
      )
      .then((res) => setBills(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load bills");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h2>All Vendor Bills (Admin)</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && bills.length === 0 && <p>No bills found</p>}

      {bills.length > 0 && (
        <table style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Company</th>
              <th>Work</th>
              <th>Bill No</th>
              <th>Site</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Bill</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id}>
                <td>{b.vendor?.name}</td>
                <td>{b.vendor?.companyName}</td>
                <td>{b.workName}</td>
                <td>{b.billNo}</td>
                <td>{b.site}</td>
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

export default AdminBills;
