import React, { useEffect, useState } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";
function SiteExpense() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const adminSiteId = queryParams.get("siteId");
  const siteId = user.role === "admin" ? adminSiteId : user.siteId;

  const [siteName, setSiteName] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({
    date: "",
    particular: "",
    inAmount: "",
    outAmount: "",
  });

  const [bill, setBill] = useState(null);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setBill(e.target.files[0]);
  };

  const fetchExpenses = async () => {
    if (!siteId) return;
    try {
      const res = await API.get(`/site-expense`, {
        params: { siteId },
      });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSiteName = async () => {
    if (!siteId) return;
    try {
      const res = await API.get(`/sites`);
      const site = res.data.find(
        (s) => s.siteId === siteId || s._id === siteId
      );
      if (site) setSiteName(site.name);
      else setSiteName("");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchExpenses();
      fetchSiteName();
    }
  }, [siteId]);

  const saveExpense = async () => {
    if (!form.date || (!form.inAmount && !form.outAmount)) {
      alert("Please enter date and at least one of Cash In or Cash Out");
      return;
    }

    try {
      const data = new FormData();
      data.append("siteId", siteId);
      data.append("date", form.date);
      data.append("particular", form.particular);
      data.append("inAmount", form.inAmount);
      data.append("outAmount", form.outAmount);
      if (bill) data.append("bill", bill);

      await API.post(`/site-expense`, data);

      setForm({ date: "", particular: "", inAmount: "", outAmount: "" });
      setBill(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert("Error saving expense");
    }
  };

const downloadBill = async (url) => {
  try {
    const response = await API.get(url, {
      responseType: "blob",
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "bill.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed", err);
  }
};


  let balance = 0;

  return (
    <div style={{ padding: "30px", minHeight: "100vh" }}>
      <h2 style={{ marginTop: "90px", marginBottom: "20px" }}>
        Site Expense {siteName ? `- ${siteName}` : ""}
      </h2>


      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="particular"
          placeholder="Particular"
          value={form.particular}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          type="number"
          name="inAmount"
          placeholder="Cash In"
          value={form.inAmount}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          type="number"
          name="outAmount"
          placeholder="Cash Out"
          value={form.outAmount}
          onChange={handleChange}
          style={inputStyle}
        />
        <input type="file" onChange={handleFile} style={inputStyle} />
        <button onClick={saveExpense} style={saveBtn}>
          Save Expense
        </button>
      </div>


      <table style={table}>
        <thead>
          <tr style={{ background: "#1e293b", color: "white" }}>
            <th style={th}>Date</th>
            <th style={th}>Particular</th>
            <th style={th}>Cash In</th>
            <th style={th}>Cash Out</th>
            <th style={th}>Balance</th>
            <th style={th}>Bill</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => {
            balance += Number(e.inAmount || 0) - Number(e.outAmount || 0);
            return (
              <tr key={e._id}>
                <td style={td}>{e.date}</td>
                <td style={td}>{e.particular}</td>
                <td style={{ ...td, color: "green", fontWeight: "bold" }}>
                  {e.inAmount}
                </td>
                <td style={{ ...td, color: "red", fontWeight: "bold" }}>
                  {e.outAmount}
                </td>
                <td style={{ ...td, fontWeight: "bold" }}>{balance}</td>
               <td style={td}>
  {e.billImage && (
    <>
      <img
        src={e.billImage}
        alt=""
        style={billImg}
        onClick={() => setPreviewImage(e.billImage)}
      />

{user.role === "admin" && (
  <button
    onClick={() => downloadBill(e.billImage)}
    style={{
      marginTop: "5px",
      padding: "4px 8px",
      fontSize: "12px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    }}
  >
    Download
  </button>
)}
    </>
  )}
</td>
              </tr>
            );
          })}
        </tbody>
      </table>

 
      {previewImage && (
        <div style={popupOverlay} onClick={() => setPreviewImage(null)}>
          <div style={popupBox}>
            <img src={previewImage} alt="" style={popupImage} />
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};

const saveBtn = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  padding: "12px",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  textAlign: "center",
};

const billImg = {
  width: "50px",
  height: "50px",
  objectFit: "cover",
  borderRadius: "6px",
  cursor: "pointer",
};

const popupOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const popupBox = {
  maxWidth: "90%",
  maxHeight: "90%",
};

const popupImage = {
  width: "100%",
  height: "auto",
  borderRadius: "8px",
};

export default SiteExpense;
