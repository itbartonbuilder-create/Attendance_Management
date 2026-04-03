import React, { useEffect, useState } from "react";
import API from "../api";

function ManagerBills() {
  const [user, setUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({
    workName: "",
    amount: "",
    quantity: "",
    gstType: "non-gst",
    gstPercent: 0,
    billDate: ""
  });
  const [billFile, setBillFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    setUser(savedUser);
  }, []);

  const fetchBills = async () => {
    if (!user) return;
    try {
      const res = await API.get("/bill", {
        params: { role: "manager", userId: user._id, site: user.site }
      });
      setBills(res.data || []);
    } catch {
      alert("Failed to load bills");
    }
  };

  useEffect(() => {
    if (user && user.role === "manager") fetchBills();
  }, [user]);

  if (!user) return <h2 style={{ padding: 40 }}>Loading...</h2>;
  if (user.role !== "manager") return <h2 style={{ padding: 40 }}>Access Denied</h2>;

  const handleChange = (e) => {
    let value = e.target.value;
    if (["amount", "quantity", "gstPercent"].includes(e.target.name)) {
      value = parseFloat(value) || 0;
    }
    setForm({ ...form, [e.target.name]: value });
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!billFile) return alert("Upload bill file");

    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(form).forEach((key) => data.append(key, form[key]));
      data.append("billFile", billFile);
      data.append("site", user.site);
      data.append("sentTo", user._id);
      data.append("vendor", user._id);

      await API.post("/bill/create", data);
      alert("Bill Created");

      setForm({
        workName: "",
        amount: "",
        quantity: "",
        gstType: "non-gst",
        gstPercent: 0,
        billDate: ""
      });
      setBillFile(null);
      fetchBills();
    } catch {
      alert("Bill creation failed");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = Number(form.amount) * Number(form.quantity);
  const gstAmount = form.gstType === "gst" ? (subtotal * Number(form.gstPercent)) / 100 : 0;
  const totalAmount = subtotal + gstAmount;

  return (
    <div style={page}>
      <h2 style={title}>{user.site} Manager Bills</h2>

      <form style={formBox} onSubmit={handleCreateBill}>
        <h3>Create Bill</h3>
        <div style={row}>
          <input
            style={input}
            name="workName"
            placeholder="shop_Name/material"
            value={form.workName}
            onChange={handleChange}
            required
          />
          <input
            style={input}
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            required
          />
          <input
            style={input}
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            required
          />
          <div style={row}>
            <select style={input} name="gstType" value={form.gstType} onChange={handleChange}>
              <option value="non-gst">Non GST</option>
              <option value="gst">GST</option>
            </select>
            {form.gstType === "gst" && (
              <select style={input} name="gstPercent" value={form.gstPercent} onChange={handleChange}>
                <option value={0}>Select</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
              </select>
            )}
          </div>
        </div>
        <div style={row}>
          <input
            style={input}
            type="date"
            name="billDate"
            value={form.billDate}
            onChange={handleChange}
            required
          />
        </div>
        <input type="file" onChange={(e) => setBillFile(e.target.files[0])} required />
        <button style={btn}>{loading ? "Saving..." : "Create Bill"}</button>
      </form>

      <table style={table}>
        <thead>
          <tr style={tableHead}>
            <th style={th}>Vendor</th>
            <th style={th}>Work/Supply Name</th>
            <th style={th}>Bill No</th>
            <th style={th}>Amount</th>
            <th style={th}>Qty</th>
            <th style={th}>GST</th>
            <th style={th}>Total</th>
            <th style={th}>Date</th>
            <th style={th}>Bill</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b._id} style={rowStyle}>
              <td style={td}>{b.vendor?.name || "Manager"}</td>
              <td style={td}>{b.workName}</td>
              <td style={td}>{b.billNo}</td>
              <td style={td}>₹{b.amount}</td>
              <td style={td}>{b.quantity}</td>
              <td style={td}>{b.gstType === "gst" ? `${b.gstPercent}%` : "No GST"}</td>
              <td style={td}>₹{b.totalAmount}</td>
              <td style={td}>{new Date(b.billDate).toLocaleDateString()}</td>
              <td style={td}>
                {b.billFile && (
                  <a href={b.billFile} target="_blank" rel="noopener noreferrer" style={viewBtn}>
                    View Bill
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const page = { 
   padding: "100px 20px",
   background: "#121212",
   minHeight: "100vh",
   color: "white" 
  };
const title = {
   marginBottom: "25px" 
  };
const formBox = { 
  background: "#1f1f1f",
  padding: "25px",
  borderRadius: "10px", 
  marginBottom: "40px"
 };
const row = { 
  display: "flex", 
  gap: "10px", 
  marginBottom: "15px", 
  flexWrap: "wrap", 
  width: "100%" 
};
const input = { 
  flex: "1 1 200px", 
  padding: "10px", 
  borderRadius: "6px", 
  border: "1px solid #444", 
  background: "#2c2c2c", 
  color: "white", 
  minWidth: "140px" 
};
const btn = { 
  background: "#1e88e5", 
  padding: "12px", 
  border: "none", 
  borderRadius: "6px", 
  color: "white", 
  cursor: "pointer", 
  width: "100%" 
};
const table = { 
  width: "100%", 
  borderCollapse: "collapse" 
};
const tableHead = { 
  background: "#2c3e50" 
};
const th = { 
  padding: "12px", 
  textAlign: "left" 
};
const td = { 
  padding: "12px" 
};
const rowStyle = { 
  borderBottom: "1px solid #444" 
};
const viewBtn = { 
  background: "#3498db", 
  border: "none", 
  padding: "6px 12px", 
  color: "white", 
  borderRadius: "5px", 
  cursor: "pointer"
  };

export default ManagerBills;
