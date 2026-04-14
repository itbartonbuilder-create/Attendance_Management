import { useEffect, useState } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const AdminBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBills, setSelectedBills] = useState([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedSite = queryParams.get("siteId");

  if (!user || (user.role !== "admin" && user.role !== "accountant")) {
    return <h2 style={{ color: "white", padding: 40 }}>Access Denied</h2>;
  }

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await API.get("/bill", {
        params: {
          role: user.role,
          site: selectedSite,
        },
      });
      setBills(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSite) fetchBills();
  }, [selectedSite]);

  const toggleBillSelection = (id) => {
  setSelectedBills((prev) =>
    prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
  );
};

const toggleSelectAll = () => {
  if (selectedBills.length === bills.length) {
    setSelectedBills([]);
  } else {
    setSelectedBills(bills.map((b) => b._id));
  }
};
  const downloadBill = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "bill-file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const changeStatus = async (billId, status) => {
    const confirmMsg = status === "approved" ? "Approve this bill?" : "Reject this bill?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await API.put(`/bill/${billId}/status`, { status });
      setBills((prev) => prev.map((b) => (b._id === billId ? { ...b, status } : b)));
    } catch (err) {
      console.error(err);
      alert("Failed to update bill status");
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      bills.map((b) => ({
        Vendor: b.vendor?.name || "Manager",
        Company: b.vendor?.companyName || "-",
        Work: b.workName,
        "Bill No": b.billNo,
        Site: b.site,
        Amount: b.amount,
        Quantity: b.quantity,
        GST: b.gstType === "gst" ? `${b.gstPercent}%` : "No GST",
        Total: b.totalAmount,
        Date: new Date(b.billDate).toLocaleDateString(),
        Status: b.status || "pending",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills");
    XLSX.writeFile(wb, `AdminBills_${selectedSite}.xlsx`);
  };

const downloadSelectedPDF = () => {
  if (selectedBills.length === 0) {
    alert("Select at least one bill");
    return;
  }

  const selectedData = bills.filter((b) =>
    selectedBills.includes(b._id)
  );

  const doc = new jsPDF();
  doc.text(`Selected Bills - ${selectedSite}`, 14, 15);

  const columns = [
    "Vendor","Company","Work","Bill No","Site",
    "Amount","Qty","GST","Total","Date","Status"
  ];

  const rows = selectedData.map((b) => [
    b.vendor?.name || "Manager",
    b.vendor?.companyName || "-",
    b.workName,
    b.billNo,
    b.site,
    b.amount,
    b.quantity,
    b.gstType === "gst" ? `${b.gstPercent}%` : "No GST",
    b.totalAmount,
    new Date(b.billDate).toLocaleDateString(),
    b.status || "pending",
  ]);

  autoTable(doc, { head: [columns], body: rows, startY: 20 });

  doc.save(`Selected_Bills_${selectedSite}.pdf`);
};

  return (
    <div style={page}>
      <h2 style={{ marginBottom: 20 }}>All Vendor / Manager Bills</h2>

      <div style={{ marginBottom: 20, display: "flex", gap: "10px" }}>
        <button style={btn} onClick={exportToExcel}>Download Excel</button>
        <button style={btn} onClick={downloadSelectedPDF}>Download PDF</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && bills.length === 0 && <p>No bills found</p>}

      {!loading && bills.length > 0 && (
        <table style={table}>
          <thead>
            <tr style={tableHead}>
            <th style={th}>
              <input
                type="checkbox"
                checked={selectedBills.length === bills.length && bills.length > 0}
                onChange={toggleSelectAll}/> </th>
              <th style={th}>Vendor</th>
              <th style={th}>Company</th>
              <th style={th}>Shop_name/material</th>
              <th style={th}>Bill No</th>
              <th style={th}>Site</th>
              <th style={th}>Amount</th>
              <th style={th}>Quantity</th>
              <th style={th}>GST</th>
              <th style={th}>Total</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              <th style={th}>Bill</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => {
              const status = b.status || "pending";
              return (
                <tr key={b._id} style={row}>
                <td style={td}>
                <input
                  type="checkbox"
                  checked={selectedBills.includes(b._id)}
                  onChange={() => toggleBillSelection(b._id)}
                />
              </td>
                  <td style={td}>{b.vendor?.name || "Manager"}</td>
                  <td style={td}>{b.vendor?.companyName || "-"}</td>
                  <td style={td}>{b.workName}</td>
                  <td style={td}>{b.billNo}</td>
                  <td style={td}>{b.site}</td>
                  <td style={td}>₹{b.amount}</td>
                  <td style={td}>{b.quantity}</td>
                  <td style={td}>{b.gstType === "gst" ? `${b.gstPercent}%` : "No GST"}</td>
                  <td style={td}>₹{b.totalAmount}</td>
                  <td style={td}>{new Date(b.billDate).toLocaleDateString()}</td>
                  <td style={{ ...td, fontWeight: 600, color: status === "approved" ? "lightgreen" : status === "rejected" ? "salmon" : "orange" }}>
                    {status}
                  </td>
                  <td style={td}>
                    {b.billFile ? (
                      <>
                        <a href={b.billFile} target="_blank" rel="noreferrer" style={viewBtn}>View</a>
                        <button style={downloadBtn} onClick={() => downloadBill(b.billFile)}>Download</button>
                      </>
                    ) : "-"}
                  </td>
                  <td style={td}>
                    {status === "pending" ? (
                      <>
                        <button style={approveBtn} onClick={() => changeStatus(b._id, "approved")}>Approve</button>
                        <button style={rejectBtn} onClick={() => changeStatus(b._id, "rejected")}>Reject</button>
                      </>
                    ) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

const page = { 
  padding: "100px 30px", 
  background: "#121212", 
  minHeight: "100vh", 
  color: "white" 
};
const table = { 
  width: "100%", 
  borderCollapse: "collapse", 
  marginTop: 20 
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
const row = { 
  borderBottom: "1px solid #444" 
};
const btn = { 
  background: "#1e88e5", 
  padding: "10px 15px", 
  border: "none", 
  borderRadius: "6px", 
  color: "white", 
  cursor: "pointer" 
};
const approveBtn = { 
  background: "green", 
  color: "white", 
  border: "none", 
  padding: "6px 10px", 
  marginRight: "6px", 
  borderRadius: "4px", 
  cursor: "pointer" 
};
const rejectBtn = { 
  background: "crimson", 
  color: "white", 
  border: "none", 
  padding: "6px 10px", 
  borderRadius: "4px", 
  cursor: "pointer" 
};
const viewBtn = { 
  background: "#3498db", 
  color: "white", 
  padding: "6px 10px", 
  borderRadius: "4px", 
  marginRight: "6px", 
  textDecoration: "none" 
};
const downloadBtn = { 
  background: "#2ecc71", 
  color: "white", 
  padding: "6px 10px", 
  borderRadius: "4px", 
  cursor: "pointer" 
};

export default AdminBills;
