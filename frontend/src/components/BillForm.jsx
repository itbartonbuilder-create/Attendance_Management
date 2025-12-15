import { useState } from "react";
import axios from "axios";

function BillForm() {
  const [form, setForm] = useState({
    workName: "",
    billNo: "",
    site: "",
    sentTo: "",
    amount: "",
    billDate: "",
  });

  const [billFile, setBillFile] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(form).forEach((key) => data.append(key, form[key]));
    data.append("billFile", billFile);

    await axios.post(
      "https://attendance-management-backend-vh2w.onrender.com/api/bill/create",
      data
    );

    alert("✅ Bill Submitted Successfully");
  };

  return (
    <div style={page}>
      <form style={formBox} onSubmit={handleSubmit}>
        <h2 style={heading}>Submit Bill</h2>

        <div style={row}>
          <input
            style={input}
            name="workName"
            placeholder="Work / Supply Name"
            onChange={handleChange}
          />
          <input
            style={input}
            name="billNo"
            placeholder="Bill No"
            onChange={handleChange}
          />
        </div>

        <div style={row}>
          <select style={input} name="site" onChange={handleChange}>
            <option value="">Select Site</option>
            <option>Bangalore</option>
            <option>Faridabad</option>
          </select>

          <select style={input} name="sentTo" onChange={handleChange}>
            <option value="">Send To</option>
            <option>Admin</option>
            <option>Manager</option>
          </select>
        </div>

        <div style={row}>
          <input
            style={input}
            name="amount"
            type="number"
            placeholder="Total Amount"
            onChange={handleChange}
          />
          <input
            style={input}
            name="billDate"
            type="date"
            onChange={handleChange}
          />
        </div>

        <div style={row}>
          <input
            style={fileInput}
            type="file"
            onChange={(e) => setBillFile(e.target.files[0])}
          />
        </div>

        <button style={btn}>Submit Bill</button>
      </form>
    </div>
  );
}

/* ====== STYLES ====== */

const page = {
  padding: "30px",
};

const formBox = {
  // background: "#1f1f1f",
  padding: "25px",
  borderRadius: "10px",
  maxWidth: "1050px",
  color: "white",
  boxShadow: "0 0 10px rgba(0,0,0,0.6)",
};

const heading = {
  marginBottom: "20px",
  borderBottom: "1px solid #444",
  paddingBottom: "10px",
};

const row = {
  display: "flex",
  gap: "15px",
  marginBottom: "15px",
};

const input = {
  flex: 1,
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #444",
  background: "#2c2c2c",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

const fileInput = {
  color: "white",
};

const btn = {
  marginTop: "10px",
  background: "#1e88e5",
  color: "white",
  padding: "12px 25px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "15px",
};

export default BillForm;
