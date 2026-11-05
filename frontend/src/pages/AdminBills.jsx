import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  downloadSingleVoucherPDF,
  convertNumberToWords,
  formatDateDMY
} from "../utils/VoucherUtils";

const AdminBills = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedSite = queryParams.get("siteId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bills, setBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [billType, setBillType] = useState("gst");
  const [voucherForm, setVoucherForm] = useState({
    

    payableTo: "",
    site: selectedSite || "",
    particulars: "",
    paymentMode: "Cash",
    amount: "",
    amountWords: "",
    remarks: "",
    billFile: null,
  });

  if (
    !user ||
    (user.role !== "admin" &&
      user.role !== "accountant")
  ) {
    return (
      <h2
        style={{
          color: "#fff",
          padding: 40,
        }}
      >
        Access Denied
      </h2>
    );
  }

const fetchBills = async () => {
  try {
    setLoading(true);
    setError("");

    const res = await API.get("/bill", {
      params: {
        role: user.role,
        site: selectedSite,
      },
    });

    let managerBills = res.data || [];

    let workOrderBills = [];

    if (selectedSite) {
      const workOrderRes = await API.get("/work-orders/site-bills", {
        params: {
          site: selectedSite,
        },
      });

      workOrderBills = (workOrderRes.data || []).map((b) => ({
        ...b,
        isWorkOrderBill: true,
        isVoucher: false,
        gstType: "non-gst",
        payableTo: b.vendorName || "—",
        vendor: {
          name: b.vendorName || "—",
        },
        createdByName: b.createdBy || "Admin",
        paymentMode: b.paymentMode || "Cash",
      }));
    }

    setBills([...workOrderBills, ...managerBills]);
  } catch (err) {
    console.error("Fetch admin bills error:", err);
    setError("Failed to load bills");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBills();
  }, [selectedSite]);
  const filteredBills = useMemo(() => {

    let data = [...bills];
    if (billType === "gst") {
      data = data.filter(
        (x) => x.gstType === "gst"
      );
    } else {
      data = data.filter(
        (x) =>
          x.gstType === "non-gst" ||
          x.isVoucher
      );
    }
    return data;
  }, [bills, billType]);

  const toggleBillSelection = (id) => {
    setSelectedBills((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]

    );

  };

  const toggleSelectAll = () => {

    if (
      selectedBills.length ===
      filteredBills.length
    ) {

      setSelectedBills([]);

    } else {
      setSelectedBills(
        filteredBills.map((x) => x._id)
      );
    }
  };
  const downloadBill = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download Failed");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const type = response.headers.get("content-type");
      if (type?.includes("pdf")) {
        link.download = "Bill.pdf";
      } else if (type?.includes("png")) {
        link.download = "Bill.png";
      } else if (type?.includes("jpeg")) {
        link.download = "Bill.jpg";
      } else {
        link.download = "Bill";
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.log(err);
    }
  };

 const triggerDownload = (b) => {

  const dateToUse = formatDateDMY(
  b.billDate || b.createdAt
);
  const paymentModeToUse = b.paymentMode || "Cash";

  const normalizedData = {
    voucherNo: b.billNo || "01",
    payableTo: b.vendor?.name || b.payableTo || "N/A", 
    particulars: b.workName || b.particulars || "N/A",
    paymentMode: paymentModeToUse, 
    amount: b.amount || 0,
    screenshotUrl: b.screenshotUrl || b.billFile || null,
    site: b.site || selectedSite,
    createdByName: b.createdByName || "Manager"
  };

  downloadSingleVoucherPDF(normalizedData, {
    currentDate: dateToUse, 
    loggedInName: user?.name || "Manager",
    currentSite: selectedSite || b.site
  });
};

  const downloadSelectedPDF = () => {
    const rows = filteredBills
      .filter((x) =>
        selectedBills.includes(x._id)
      )
      .map((x) => [
        x.vendor?.name,
        x.billNo,
        x.site,
        x.amount,
      ]);
    const doc = new jsPDF();
    autoTable(doc, {
      head: [[
        "Vendor",
        "Bill",
        "Site",
        "Amount",
      ]],
      body: rows,
    });
    doc.save("Bills.pdf"); };
return (
<div style={page}>
<h2 style={{marginBottom:20}}>
All Manager Bills</h2>
<div
  style={{
    marginBottom: "20px",
  }}
>
  <label
    style={{
      color: "#fff",
      marginRight: "10px",
      fontWeight: "600",
    }}
  >
    Bill Type :
  </label>
  <select
    value={billType}
    onChange={(e) => setBillType(e.target.value)}
    style={{
      padding: "10px 15px",
      borderRadius: "6px",
      width: "220px",
      fontSize: "15px",
      cursor: "pointer",
    }}
  >
    <option value="gst">GST Bill</option>
    <option value="non-gst">Non GST Voucher</option>
  </select>
</div>

{loading && <p>Loading...</p>}
{error && (
<p style={{color:"red"}}>
{error}
</p>
)}
{!loading && filteredBills.length > 0 && (
  <>
    {billType === "gst" ? (
      <table style={table}>
        <thead>
          <tr style={tableHead}>
            <th style={th}>Created By</th>
            <th style={th}>Shop / Material</th>
            <th style={th}>Bill No</th>
            <th style={th}>Site</th>
            <th style={th}>Amount</th>
            <th style={th}>Qty</th>
            <th style={th}>GST</th>
            <th style={th}>Total</th>
            <th style={th}>Date</th>
            <th style={th}>Bill</th>
          </tr>
        </thead>
        <tbody>
          {filteredBills.map((b) => (
            
            <tr key={b._id} style={row}>
              <td style={td}>{b.createdByName || "Manager"}</td>
              <td style={td}>{b.workName}</td>
              <td style={td}>{b.billNo}</td>
              <td style={td}>{b.site}</td>
              <td style={td}>₹{b.amount}</td>
              <td style={td}>{b.quantity}</td>
              <td style={td}>{b.gstPercent}%</td>
              <td style={td}>₹{b.totalAmount}</td>
              <td style={td}>{formatDateDMY(b.billDate || b.createdAt)}</td>
            <td style={td}>
  {(b.billFile || b.screenshotUrl) ? (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <a
        href={b.billFile || b.screenshotUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={viewBtn}
      >
        View Proof
      </a>

      <button
        style={downloadBtn}
        onClick={() => downloadBill(b.billFile || b.screenshotUrl)}
      >
        Download
      </button>
    </div>
  ) : (
    "No Proof Uploaded"
  )}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (

      <table style={table}>
        <thead>
          <tr style={tableHead}>
            <th style={th}>Payable To</th>
            <th style={th}>Shop / Material</th>
            <th style={th}>Created By</th>
            <th style={th}>Site</th>
            <th style={th}>Voucher No</th>
            <th style={th}>Amount</th>
            <th style={th}>Date</th>
            <th style={th}>Bill</th>
          </tr>
        </thead>
        <tbody>
          {filteredBills.map((b) => (
            <tr key={b._id} style={row}>
              <td style={td}>{b.vendor?.name || "-"}</td>
              <td style={td}>{b.workName || "-"}</td>
              <td style={td}>{b.createdByName || "Manager"}</td>
              <td style={td}>{b.site || "-"}</td>
              <td style={td}>{b.billNo}</td>
              <td style={td}>₹{b.amount}</td>
              <td style={td}>{formatDateDMY(b.billDate || b.createdAt)}</td>
            <td style={td}>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    {(b.screenshotUrl || b.billFile) ? (
      <>
        <a
          href={b.screenshotUrl || b.billFile}
          target="_blank"
          rel="noopener noreferrer"
          style={viewBtn}
        >
          View Proof
        </a>

        <button
          style={downloadBtn}
          onClick={() => downloadBill(b.screenshotUrl || b.billFile)}
        >
          Download Proof
        </button>
      </>
    ) : (
      <span>No Proof</span>
    )}

    <button
      style={downloadBtn}
      onClick={() => triggerDownload(b)}
    >
      Voucher PDF
    </button>
  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </>
)}
</div>
);
};
const page = {
  padding: "100px 30px",
  background: "#121212",
  minHeight: "100vh",
  color: "#fff",
};
const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 20,
  background: "#1f1f1f",
};
const tableHead = {
  background: "#2563eb",
};
const row = {
  borderBottom: "1px solid #374151",
};
const th = {
  padding: "12px",
  textAlign: "left",
  // color: "#fff",
  fontWeight: "600",
  whiteSpace: "nowrap",
};
const td = {
  padding: "12px",
  borderBottom: "1px solid #374151",
  whiteSpace: "nowrap",
};
const btn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};
const viewBtn = {
  background: "#2563eb",
  color: "#fff",
  textDecoration: "none",
  padding: "6px 12px",
  borderRadius: "5px",
  marginRight: "8px",
  display: "inline-block",
};
const downloadBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "5px",
  cursor: "pointer",
};
export default AdminBills;
