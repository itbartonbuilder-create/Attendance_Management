import React, { useEffect, useState } from "react";
import axios from "axios";

function ManagerBills() {

  const user = JSON.parse(localStorage.getItem("user"));

  const [bills, setBills] = useState([]);
 

  const [form, setForm] = useState({
    workName: "",
    amount: "",
    billDate: ""
  });

  const [billFile, setBillFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== "manager") {
    return <h2 style={{ padding: 40 }}>Access Denied</h2>;
  }

 

  const fetchBills = async () => {
    try {

      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill",
        {
          params: {
            role: "manager",
            userId: user._id,
            site: user.site
          }
        }
      );

      setBills(res.data || []);

    } catch (err) {
      alert("Failed to load bills");
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

 

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 

  const handleCreateBill = async (e) => {

    e.preventDefault();

    if (!billFile) {
      alert("Upload bill file");
      return;
    }

    try {

      setLoading(true);

      const data = new FormData();

      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });

      data.append("billFile", billFile);
      data.append("site", user.site);
      data.append("sentTo", user._id);
      data.append("vendor", user._id);

      await axios.post(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill/create",
        data
      );

      alert("Bill Created");

      setForm({
        workName: "",
        amount: "",
        billDate: ""
      });

      setBillFile(null);

      fetchBills();

    } catch (err) {
      alert("Bill creation failed");
    } finally {
      setLoading(false);
    }
  };


  const updateStatus = async (id, status) => {

    if (!window.confirm(`Are you sure to ${status}?`)) return;

    try {

      await axios.put(
        `https://attendance-management-backend-vh2w.onrender.com/api/bill/${id}/status`,
        { status }
      );

      setBills(prev =>
        prev.map(b =>
          b._id === id ? { ...b, status } : b
        )
      );

    } catch {
      alert("Status update failed");
    }
  };

  return (

    <div style={page}>

      <h2 style={title}>{user.site} Manager Bills</h2>


      <form style={formBox} onSubmit={handleCreateBill}>

        <h3>Create Bill</h3>

        <div style={row}>

          <input
            style={input}
            name="workName"
            placeholder="Work Name"
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
  <input
            type="file"
            onChange={(e) => setBillFile(e.target.files[0])}
            required
          />
        <button style={btn}>
          {loading ? "Saving..." : "Create Bill"}
        </button>

      </form>

      <table style={table}>

        <thead>

          <tr style={tableHead}>
            <th style={th}>Vendor</th>
            <th style={th}>Work/Supply Name</th>
            <th style={th}>Bill No</th>
            <th style={th}>Amount</th>
            <th style={th}>Date</th>
            {/* <th style={th}>Status</th> */}
            <th style={th}>Bill</th>
            {/* <th style={th}>Action</th> */}
          </tr>

        </thead>

        <tbody>

          {bills.map((b) => {

            const status = b.status || "pending";

            return (

              <tr key={b._id} style={rowStyle}>

                <td style={td}>{b.vendor?.name || "Manager"}</td>
                <td style={td}>{b.workName}</td>
                <td style={td}>{b.billNo}</td>
                <td style={td}>₹{b.amount}</td>
                <td style={td}>{new Date(b.billDate).toLocaleDateString()}</td>

                {/* <td
                  style={{
                    ...td,
                    fontWeight: "600",
                    color:
                      status === "approved"
                        ? "lightgreen"
                        : status === "rejected"
                        ? "salmon"
                        : "orange"
                  }}
                >
                  {status}
                </td> */}

                <td style={td}>

                  {b.billFile && (
                   <a
  href={b.billFile}
  target="_blank"
  rel="noopener noreferrer"
  style={viewBtn}
>
  View Bill
</a>
                  )}

                </td>
{/* 
                <td style={td}>

                  {status === "pending" ? (
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

                </td> */}

              </tr>

            );
          })}

        </tbody>

      </table>

    </div>
  );
}


const page = {
  padding: "100px 40px",
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

const approveBtn = {
  background: "green",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "5px",
  marginRight: "5px",
  cursor: "pointer"
};

const rejectBtn = {
  background: "red",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "5px",
  cursor: "pointer"
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const modal = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  position: "relative"
};

const closeBtn = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "red",
  color: "white",
  border: "none",
  padding: "5px 10px",
  cursor: "pointer"
};

export default ManagerBills;
