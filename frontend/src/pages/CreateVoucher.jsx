import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CreateVoucher = () => {
  const navigate = useNavigate();

  const [voucherNo, setVoucherNo] = useState("");
  const [payableTo, setPayableTo] = useState("");
  const [particulars, setParticulars] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [existingVouchers, setExistingVouchers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  

  const [selectedVouchers, setSelectedVouchers] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")) || {}; 
  const queryParams = new URLSearchParams(window.location.search);
  const currentSite = queryParams.get("site") || localStorage.getItem("currentSite") || user.site ; 
  
  const loggedInName = user.name || "Nancy jain";
  const loggedInUid = user.id || user._id || "12345";
  const currentDate = queryParams.get("date") || new Date().toLocaleDateString("en-IN");

  const convertNumberToWords = (num) => {
    if (!num || isNaN(num)) return "";
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const g = ["", "Thousand", "Lakh", "Crore"];

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
        console.error("Error fetching voucher number ❌", err);
      }
    };
    fetchVoucherNumber();
  }, []);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    setAmountInWords(convertNumberToWords(val));
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
      setSelectedVouchers([]); // हिस्ट्री लोड होने पर सिलेक्शन रीसेट करें
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching history ❌", err);
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
      alert("Please select at least one voucher to download! ❌");
      return;
    }

    const doc = new jsPDF();

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BARTONS BUILDERS LIMITED", 14, 15);
    
    doc.setFontSize(12);
    doc.setFont("Helvetica", "normal");
    doc.text(`Voucher History Report - Site: ${currentSite}`, 14, 22);
    doc.text(`Generated Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);

    const tableHeaders = [["Voucher No", "Date", "Paid To", "Particulars", "Amount", "Created By"]];
    const tableRows = vouchersToDownload.map((item) => [
      item.voucherNo || "-",
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : currentDate,
      item.payableTo || "-",
      item.particulars || "-",
      `Rs. ${item.amount}/-`,
      item.createdByName || "-"
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [244, 176, 132], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        4: { halign: "right" }
      }
    });

    doc.save(`Selected_Vouchers_${currentSite}_${new Date().toLocaleDateString("en-IN")}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!voucherNo) {
      alert("Voucher number is still loading. Please wait a moment.");
      return;
    }
    
    if (!payableTo || !particulars || !amount) {
      alert("All fields are required!");
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    const voucherData = {
      voucherNo, 
      payableTo,
      particulars,
      paymentMode,
      amount: Number(amount),
      amountInWords,
      site: currentSite,
      createdByName: loggedInName,
      createdByUserId: loggedInUid
    };

    try {
      const res = await axios.post("https://attendance-management-backend-vh2w.onrender.com/api/vouchers/create", voucherData);
      
      if (res.data.success || res.status === 200 || res.status === 201) {
        alert("Voucher Generated and Saved Successfully! 🎉");
        
        setPayableTo("");
        setParticulars("");
        setAmount("");
        setAmountInWords("");
        
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
    <div style={{ maxWidth: "1250px", margin: "70px auto", padding: "19px", fontFamily: "Arial, sans-serif" }}>
    
      <div style={{ padding: "15px", border: "1px solid #ccc", background: "#fff8f0", boxShadow: "0px 0px 10px rgba(0,0,0,0.1)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <img 
              src="/src/assets/logo.png" 
              alt="Bartons Builders Limited" 
              style={{ height: "65px", width: "auto", objectFit: "contain" }} 
            />
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px",
              padding: "6px 14px", 
              background: "#fff", 
              border: "1px solid #e67e22", 
              borderRadius: "20px", 
              fontSize: "13px", 
              color: "#333",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              height: "fit-content"
            }}>
              <span style={{ color: "#e67e22", fontWeight: "bold" }}>🏗️</span> 
              <span>Project Site: <b style={{ color: "#e67e22" }}>{currentSite}</b></span>
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "14px" }}>
            <p style={{ margin: "2px 0", color: "blue" }}><b>Date:</b> {currentDate}</p>
            <p style={{ margin: "2px 0", color: "blue" }}><b>Voucher No:</b> <span style={{ color: "red", fontWeight: "bold" }}>{voucherNo || "00001"}</span></p>
            <input 
              type="text" 
              placeholder="Payable to (Name)" 
              value={payableTo} 
              onChange={(e) => setPayableTo(e.target.value)} 
              style={{ padding: "6px", marginTop: "5px", width: "160px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
        </div>

        <h3 style={{ background: "#f4b084", padding: "8px", margin: "15px 0", letterSpacing: "1px", textAlign: "center", color: "#fff", fontWeight: "bold" }}>Create Voucher</h3>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
          <thead>
            <tr style={{ background: "#fdddc3" }}>
              <th style={{ border: "1px solid #000", padding: "10px", textAlign: "left" }}>Particulars</th>
              <th style={{ border: "1px solid #000", padding: "10px", width: "130px" }}>Payment Mode</th>
              <th style={{ border: "1px solid #000", padding: "10px", width: "100px" }}>Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                <input 
                  type="text" 
                  placeholder="Reimbursement for office supplies..." 
                  value={particulars} 
                  onChange={(e) => setParticulars(e.target.value)} 
                  style={{ width: "96%", padding: "6px", border: "none", background: "transparent" }}
                />
              </td>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                <select 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ width: "100%", padding: "6px", border: "none", background: "transparent" }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </td>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                <input 
                  type="number" 
                  placeholder="5000" 
                  value={amount} 
                  onChange={handleAmountChange} 
                  style={{ width: "90%", padding: "6px", border: "none", background: "transparent", fontWeight: "bold" }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <p><b style={{color: "black"}}>Amount in Words:</b> <span style={{ textDecoration: "underline", marginLeft: "10px", fontStyle: "italic", color: "red" }}>{amountInWords}</span></p>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <p style={{ fontSize: "12px", color: "gray", maxWidth: "250px" }}>This voucher is valid for 30 days from the date of issue.</p>
          <div style={{ textAlign: "center", width: "200px", borderTop: "1px solid #000", paddingTop: "5px" }}>
            <b style={{ color: "#2c3e50" }}>{loggedInName}</b>
            <p style={{ margin: 0, fontSize: "12px", color: "gray" }}>Authorized Signatory</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background: "#7f8c8d", color: "#fff", flex: 1, padding: "12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            Cancel
          </button>
          
          <button type="submit" onClick={handleSubmit} disabled={isSubmitting} style={{ background: "#27ae60", color: "#fff", flex: 2, padding: "12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            {isSubmitting ? "Saving..." : "Generate & Save"}
          </button>
        </div>
      </div>

   
      <div style={{ display: "flex", justifyContent: "right", marginTop: "10px" }}>
        <button 
          type="button" 
          onClick={fetchVoucherHistory} 
          style={{ 
            background: showHistory ? "#e74c3c" : "#3498db", 
            color: "#fff", 
            padding: "10px 24px", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer", 
            fontWeight: "bold",
            boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
            width: "100%",
            maxWidth: "300px"
          }}
        >
          {isLoadingHistory ? "Loading..." : showHistory ? "🙈 Hide History" : "👁️ View History"}
        </button>
      </div>


      {showHistory && (
        <div style={{ marginTop: "20px" }}>
          
          {existingVouchers.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "#2c3e50" }}>
                Selected: {selectedVouchers.length} / {existingVouchers.length}
              </span>
              
              <button
                type="button"
                onClick={downloadHistoryPDF}
                disabled={selectedVouchers.length === 0}
                style={{
                  background: selectedVouchers.length === 0 ? "#bdc3c7" : "#e67e22",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedVouchers.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                📥 Download Selected PDF
              </button>
            </div>
          )}

          <div style={{ padding: "20px", border: "1px solid #ccbae1", background: "#fff", borderRadius: "6px", boxShadow: "0px 4px 10px rgba(0,0,0,0.05)" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#2c3e50", borderBottom: "2px solid #3498db", paddingBottom: "5px" }}>
              📋 Existing Vouchers for Site: <span style={{ color: "#e67e22" }}>{currentSite}</span>
            </h4>
            
            {existingVouchers.length === 0 ? (
              <p style={{ color: "gray", fontStyle: "italic", textAlign: "center" }}>No existing vouchers found for this site.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f2f2f2", borderBottom: "2px solid #ccc" }}>
                      <th style={{ padding: "8px", width: "40px", border: "1px solid #ddd", textAlign: "center" }}>
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll} 
                          checked={selectedVouchers.length === existingVouchers.length && existingVouchers.length > 0}
                          style={{ cursor: "pointer", width: "16px", height: "16px" }}
                        />
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Voucher No</th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Date</th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Paid To</th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Particulars</th>
                      <th style={{ padding: "8px", textAlign: "right", border: "1px solid #ddd" }}>Amount</th>
                    
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingVouchers.map((item, index) => (
                      <tr key={item._id || index} style={{ borderBottom: "1px solid #eee", background: index % 2 === 0 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>
                          <input 
                            type="checkbox"
                            checked={selectedVouchers.includes(item._id)}
                            onChange={() => handleSelectVoucher(item._id)}
                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold", color: "red" }}>{item.voucherNo}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", color: "red" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : currentDate}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", color: "red" }}>{item.payableTo}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", color: "red" }}>{item.particulars}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right", fontWeight: "bold", color: "red" }}>₹{item.amount}/-</td>
                        
                        <td style={{ padding: "8px", border: "1px solid #ddd", color: "red" }}>{item.createdByName || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateVoucher;
