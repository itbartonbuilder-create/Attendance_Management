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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!billFile) {
      alert("❌ Please attach bill file");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(form).forEach((key) => data.append(key, form[key]));
      data.append("billFile", billFile);

      await axios.post(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill/create",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("✅ Bill Submitted Successfully");

      setForm({
        workName: "",
        billNo: "",
        site: "",
        sentTo: "",
        amount: "",
        billDate: "",
      });
      setBillFile(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "❌ Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <form style={formBox} onSubmit={handleSubmit}>
        <h2 style={heading}>Vendor Bill Submission</h2>

        <div style={row}>
          <input
            style={input}
            name="workName"
            placeholder="Work / Supply Name"
            value={form.workName}
            onChange={handleChange}
            required
          />
          <input
            style={input}
            name="billNo"
            placeholder="Bill No"
            value={form.billNo}
            onChange={handleChange}
            required
          />
        </div>

        <div style={row}>
          <select
            style={input}
            name="site"
            value={form.site}
            onChange={handleChange}
            required
          >
            <option value="">Select Site</option>
            <option>Bangalore</option>
            <option>Faridabad</option>
            <option>Vaishali</option>
          </select>

          <select
            style={input}
            name="sentTo"
            value={form.sentTo}
            onChange={handleChange}
            required
          >
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
            value={form.amount}
            onChange={handleChange}
            required
          />
          <input
            style={input}
            name="billDate"
            type="date"
            value={form.billDate}
            onChange={handleChange}
            required
          />
        </div>

        <div style={row}>
          <input
            style={fileInput}
            type="file"
            accept=".jpg,.png,.pdf"
            onChange={(e) => setBillFile(e.target.files[0])}
            required
          />
        </div>

        <button style={btn} disabled={loading}>
          {loading ? "Submitting..." : "Submit Bill"}
        </button>
      </form>
    </div>
  );
}

/* ===== STYLES ===== */

const page = {
  padding: "30px",
  background: "#f4f6f8",
  minHeight: "100vh",
};

const formBox = {
  background: "#1e1e1e",
  padding: "25px",
  borderRadius: "12px",
  maxWidth: "900px",
  margin: "auto",
  color: "white",
  boxShadow: "0 0 15px rgba(0,0,0,0.4)",
};

const heading = {
  marginBottom: "20px",
  textAlign: "center",
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
};

const fileInput = {
  color: "white",
};

const btn = {
  marginTop: "15px",
  width: "100%",
  background: "#1e88e5",
  color: "white",
  padding: "12px",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer",
};

export default BillForm;
