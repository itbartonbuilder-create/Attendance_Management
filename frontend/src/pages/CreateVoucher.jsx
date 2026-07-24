import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import companyLogo from "../assets/logo.png"; 

const CreateVoucher = () => {
  const navigate = useNavigate();

  const [voucherNo, setVoucherNo] = useState("");
  const [payableTo, setPayableTo] = useState("");
  const [particulars, setParticulars] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  

  const [screenshot, setScreenshot] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [existingVouchers, setExistingVouchers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState([]);

  const [previewImage, setPreviewImage] = useState(null);

  const user = JSON.parse(localStorage.getItem("user")) || {}; 
  const queryParams = new URLSearchParams(window.location.search);
  const currentSite = queryParams.get("site") || localStorage.getItem("currentSite") || user.site || "Default Site"; 
  
  const loggedInName = user.name || "Nancy Jain";
  const loggedInUid = user.id || user._id || "12345";
  const currentDate = queryParams.get("date") || new Date().toLocaleDateString("en-IN");

  const convertNumberToWords = (num) => {
    if (!num || isNaN(num)) return "";
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";

    let str = "";
    str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
    str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
    str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
    str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred " : "";
    str += Number(n[5]) !== 0 ? ((str !== "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";
    
    return str ? str.trim() + " Rupees Only" : "";
  };

  useEffect(() => {
    const fetchVoucherNumber = async () => {
      try {
        const res = await axios.get("https://attendance-management-backend-vh2w.onrender.com/api/vouchers/next-number");
        setVoucherNo(res.data.nextVoucherNo);
      } catch (err) {
        console.error("Error fetching voucher number", err);
      }
    };
    fetchVoucherNumber();
  }, []);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    setAmountInWords(convertNumberToWords(val));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert("File size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchVoucherHistory = async () => {
    if (showHistory) {
      setShowHistory(false); 
      return;
    }

    setIsLoadingHistory(true);
    try {
      const res = await axios.get(`https://attendance-management-backend-vh2w.onrender.com/api/vouchers?site=${currentSite}`);
      const data = res.data.vouchers || res.data || [];
      const filteredData = data.filter(item => item.site === currentSite);
      
      setExistingVouchers(filteredData);
      setSelectedVouchers([]);
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching history", err);
      alert("Failed to load existing vouchers history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectVoucher = (id) => {
    if (selectedVouchers.includes(id)) {
      setSelectedVouchers(selectedVouchers.filter(item => item !== id));
    } else {
      setSelectedVouchers([...selectedVouchers, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = existingVouchers.map(item => item._id);
      setSelectedVouchers(allIds);
    } else {
      setSelectedVouchers([]);
    }
  };

  const downloadHistoryPDF = () => {
    const vouchersToDownload = existingVouchers.filter(item => selectedVouchers.includes(item._id));

    if (vouchersToDownload.length === 0) {
      alert("Please select at least one voucher to download.");
      return;
    }

    const doc = new jsPDF();

    try {
      doc.addImage(companyLogo, "PNG", 14, 10, 45, 18);
    } catch (e) {
      console.error("Logo error:", e);
    }
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.text("BARTONS BUILDERS LIMITED", 65, 18);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Voucher History Report - Site: ${currentSite}`, 65, 24);
    doc.text(`Generated Date: ${new Date().toLocaleDateString("en-IN")}`, 65, 29);

    const tableHeaders = [["Voucher No", "Date", "Paid To", "Particulars", "Mode", "Attachment", "Amount", "Created By"]];
    
    const tableRows = vouchersToDownload.map((item) => [
      item.voucherNo || "-",
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : currentDate,
      item.payableTo || "-",
      item.particulars || "-",
      item.paymentMode || "-",
      "", 
      `Rs. ${item.amount}/-`,
      item.createdByName || "-"
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 38,
      theme: "grid",
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      styles: { fontSize: 8, cellPadding: 3, verticalAlign: "middle" },
      columnStyles: { 
        5: { cellWidth: 22 }, 
        6: { halign: "right", fontStyle: "bold" } 
      },
      didParseCell: (data) => {
       
        if (data.section === "body") {
          data.row.height = 20;
        }
      },
      didDrawCell: (data) => {
        
        if (data.section === "body" && data.column.index === 5) {
          const voucher = vouchersToDownload[data.row.index];
          if (voucher && voucher.screenshotUrl) {
            try {
              const imgX = data.cell.x + 2;
              const imgY = data.cell.y + 2;
              doc.addImage(voucher.screenshotUrl, "JPEG", imgX, imgY, 18, 16);
            } catch (err) {
              console.error("Proof Image Error:", err);
            }
          }
        }
      }
    });

    doc.save(`Selected_Vouchers_${currentSite}_${new Date().toLocaleDateString("en-IN")}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!voucherNo) {
      alert("Voucher number is loading. Please wait a moment.");
      return;
    }
    
    if (!payableTo || !particulars || !amount) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    if ((paymentMode === "UPI") && !screenshot) {
      alert("Please upload payment receipt/proof for digital transactions.");
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    const voucherData = {
      voucherNo, 
      payableTo,
      particulars,
      paymentMode,
      screenshotUrl: screenshot,
      amount: Number(amount),
      amountInWords,
      site: currentSite,
      createdByName: loggedInName,
      createdByUserId: loggedInUid
    };

    try {
      const res = await axios.post("https://attendance-management-backend-vh2w.onrender.com/api/vouchers/create", voucherData);
      
      if (res.data.success || res.status === 200 || res.status === 201) {
        alert("Voucher generated .");
        
        setPayableTo("");
        setParticulars("");
        setAmount("");
        setAmountInWords("");
        setScreenshot("");
        
        if (showHistory) {
          const freshRes = await axios.get(`https://attendance-management-backend-vh2w.onrender.com/api/vouchers?site=${currentSite}`);
          const data = freshRes.data.vouchers || freshRes.data || [];
          setExistingVouchers(data.filter(item => item.site === currentSite));
        }

        const nextNumRes = await axios.get("https://attendance-management-backend-vh2w.onrender.com/api/vouchers/next-number");
        setVoucherNo(nextNumRes.data.nextVoucherNo);
      }
    } catch (error) {
      console.error("Error saving voucher", error);
      alert("Something went wrong while saving the voucher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "90px auto", padding: "0 20px", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#1e293b" }}>
      
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)", padding: "28px" }}>
     
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img 
              src={companyLogo} 
              alt="Bartons Builders Limited" 
              style={{ height: "40px", width: "auto", objectFit: "contain" }} 
            />
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>
              🏗️ Project Site: <span style={{ color: "#2563eb", fontWeight: "700" }}>{currentSite}</span>
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "14px" }}>
            <div style={{ margin: "2px 0", color: "#64748b", fontWeight: "500" }}>
              <b>Date:</b> <span style={{ color: "#0f172a" }}>{currentDate}</span>
            </div>
            <div style={{ margin: "2px 0", color: "#64748b", fontWeight: "500" }}>
              <b>Voucher No:</b> <span style={{ color: "#dc2626", fontWeight: "700" }}>{voucherNo || "01"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Payment Voucher</h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Payable To:</label>
            <input 
              type="text" 
              placeholder="Recipient Name / Vendor" 
              value={payableTo} 
              onChange={(e) => setPayableTo(e.target.value)} 
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", width: "220px" }}
            />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", marginBottom: "20px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", textAlign: "left", fontSize: "13px", color: "#475569" }}>Particulars / Description</th>
              <th style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", textAlign: "left", width: "160px", fontSize: "13px", color: "#475569" }}>Payment Mode</th>
              <th style={{ borderBottom: "1px solid #e2e8f0", padding: "12px", textAlign: "right", width: "150px", fontSize: "13px", color: "#475569" }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", background: "#ffffff" }}>
                <input 
                  type="text" 
                  placeholder="e.g., Office supplies reimbursement, site materials..." 
                  value={particulars} 
                  onChange={(e) => setParticulars(e.target.value)} 
                  style={{ width: "100%", padding: "8px", border: "none", outline: "none", fontSize: "14px", background: "transparent" }}
                />
              </td>
              <td style={{ padding: "8px 12px", background: "#ffffff", borderLeft: "1px solid #f1f5f9" }}>
                <select 
                  value={paymentMode} 
                  onChange={(e) => {
                    setPaymentMode(e.target.value);
                    if (e.target.value === "Cash") setScreenshot("");
                  }}
                  style={{ width: "100%", padding: "8px", border: "none", outline: "none", fontSize: "14px", background: "transparent", cursor: "pointer", fontWeight: "500" }}
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="UPI">📱 UPI</option>
                </select>
              </td>
              <td style={{ padding: "8px 12px", background: "#ffffff", borderLeft: "1px solid #f1f5f9" }}>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={handleAmountChange} 
                  style={{ width: "100%", padding: "8px", border: "none", outline: "none", fontSize: "15px", fontWeight: "700", textAlign: "right", color: "#0f172a", background: "transparent" }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {(paymentMode === "UPI" ) && (
          <div style={{ marginBottom: "20px", padding: "16px", border: "1px dashed #2563eb", borderRadius: "8px", background: "#eff6ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <label style={{ fontWeight: "600", fontSize: "13px", color: "#1e40af", display: "block", marginBottom: "4px" }}>
                  📎 Attach Payment Proof / Receipt ({paymentMode})
                </label>
                <span style={{ fontSize: "12px", color: "#3b82f6" }}>Upload transaction confirmation image (JPG, PNG - Max 2MB)</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ fontSize: "13px", color: "#1e293b" }}
              />
            </div>

            {screenshot && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <img 
                  src={screenshot} 
                  alt="Payment Proof" 
                  style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid #bfdbfe" }} 
                />
                <span style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>✓ Proof Attached</span>
              </div>
            )}
          </div>
        )}

        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Amount in Words: </span>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", fontStyle: "italic", marginLeft: "6px" }}>
            {amountInWords || "Zero Rupees"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, maxWidth: "300px" }}>
            Note: This voucher is an official financial record valid for 30 days from issuance.
          </p>
          <div style={{ textAlign: "center", width: "200px" }}>
            <b style={{ color: "#0f172a", fontSize: "14px" }}>{loggedInName}</b>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Authorized Signatory</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            style={{ background: "#f1f5f9", color: "#475569", flex: 1, padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            style={{ background: "#2563eb", color: "#ffffff", flex: 2, padding: "12px", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            {isSubmitting ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
        <button 
          type="button" 
          onClick={fetchVoucherHistory} 
          style={{ 
            background: showHistory ? "#0f172a" : "#ffffff", 
            color: showHistory ? "#ffffff" : "#0f172a", 
            padding: "10px 20px", 
            border: "1px solid #0f172a", 
            borderRadius: "6px", 
            cursor: "pointer", 
            fontWeight: "600",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {isLoadingHistory ? "Loading..." : showHistory ? "Hide History" : "📋 View Voucher History"}
        </button>
      </div>

  
      {showHistory && (
        <div style={{ marginTop: "16px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                Site Voucher Register
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Site: <b>{currentSite}</b></span>
            </div>

            {existingVouchers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>
                  Selected: <b>{selectedVouchers.length}</b> / {existingVouchers.length}
                </span>
                
                <button
                  type="button"
                  onClick={downloadHistoryPDF}
                  disabled={selectedVouchers.length === 0}
                  style={{
                    background: selectedVouchers.length === 0 ? "#f1f5f9" : "#16a34a",
                    color: selectedVouchers.length === 0 ? "#94a3b8" : "#ffffff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: selectedVouchers.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  📥 Export Selected PDF
                </button>
              </div>
            )}
          </div>

          {existingVouchers.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>No record vouchers found for this site.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "10px", width: "40px", textAlign: "center" }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={selectedVouchers.length === existingVouchers.length && existingVouchers.length > 0}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "10px" }}>Voucher No</th>
                    <th style={{ padding: "10px" }}>Date</th>
                    <th style={{ padding: "10px" }}>Paid To</th>
                    <th style={{ padding: "10px" }}>Particulars</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Mode</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Attachment</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "10px" }}>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {existingVouchers.map((item, index) => (
                    <tr key={item._id || index} style={{ borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input 
                          type="checkbox"
                          checked={selectedVouchers.includes(item._id)}
                          onChange={() => handleSelectVoucher(item._id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "10px", fontWeight: "600", color: "#2563eb" }}>{item.voucherNo}</td>
                      <td style={{ padding: "10px", color: "#64748b" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : currentDate}</td>
                      <td style={{ padding: "10px", fontWeight: "500" }}>{item.payableTo}</td>
                      <td style={{ padding: "10px", color: "#475569", maxWidth: "200px" }}>{item.particulars}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ background: item.paymentMode === "Cash" ? "#fef3c7" : "#dbeafe", color: item.paymentMode === "Cash" ? "#92400e" : "#1e40af", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                          {item.paymentMode || "Cash"}
                        </span>
                      </td>
                    
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        {item.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(item.screenshotUrl)}
                            style={{ background: "transparent", border: "1px solid #bfdbfe", color: "#2563eb", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                          >
                            👁️ View Attachment
                          </button>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "10px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>₹{item.amount}/-</td>
                      <td style={{ padding: "10px", color: "#64748b" }}>{item.createdByName || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {previewImage && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", maxWidth: "500px", width: "90%", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "15px", color: "#0f172a" }}>Payment Receipt / Attachment</h4>
              <button onClick={() => setPreviewImage(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            <img src={previewImage} alt="Payment Proof Full" style={{ width: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "6px" }} />
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateVoucher;
