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
      alert("Please upload bill file");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });

      data.append("billFile", billFile);

      await axios.post(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill/create",
        data
      );

      alert("✅ Bill Submitted Successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="workName" placeholder="Work Name" onChange={handleChange} />
      <input name="billNo" placeholder="Bill No" onChange={handleChange} />

      <select name="site" onChange={handleChange}>
        <option value="">Select Site</option>
        <option>Bangalore</option>
        <option>Faridabad</option>
      </select>

      <select name="sentTo" onChange={handleChange}>
        <option value="">Send To</option>
        <option>Admin</option>
        <option>Manager</option>
      </select>

      <input
        name="amount"
        type="number"
        placeholder="Amount"
        onChange={handleChange}
      />

      <input name="billDate" type="date" onChange={handleChange} />

      <input type="file" onChange={(e) => setBillFile(e.target.files[0])} />

      <button disabled={loading}>
        {loading ? "Submitting..." : "Submit Bill"}
      </button>
    </form>
  );
}

export default BillForm;
