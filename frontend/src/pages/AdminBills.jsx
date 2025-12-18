import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminBills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    axios
      .get("https://attendance-management-backend-vh2w.onrender.com/api/bill")
      .then((res) => setBills(res.data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📋 All Vendor Bills (Admin)</h2>

      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Work</th>
            <th>Bill No</th>
            <th>Site</th>
            <th>Manager</th>
            <th>Amount</th>
            <th>Date</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b._id}>
              <td>{b.workName}</td>
              <td>{b.billNo}</td>
              <td>{b.site}</td>
              <td>{b.sentTo}</td>
              <td>₹{b.amount}</td>
              <td>{b.billDate}</td>
              <td>
                <a
                  href={`https://attendance-management-backend-vh2w.onrender.com/uploads/${b.billFile}`}
                  target="_blank"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminBills;
