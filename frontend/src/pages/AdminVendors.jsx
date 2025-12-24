import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/vendor"
      );
      setVendors(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = [
      "Name",
      "Company",
      "Contact",
      "Aadhar No",
      "PAN No",
      "Vendor Type",
      "Category",
      "GST",
      "Registered On",
    ];

    const rows = vendors.map((v) => [
      v.name,
      v.companyName || "",
      v.contactNo,
      v.aadharNumber || "",
      v.panNumber || "",
      v.vendorType,
      v.category,
      v.gstNumber || "",
      new Date(v.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vendors_list.csv";
    link.click();
  };

  if (loading) return <h2 style={{ color: "white" }}>Loading vendors...</h2>;

  return (
    <div className="page">
      <h2>All Registered Vendors</h2>

      <button style={btn} onClick={downloadCSV}>
        Download Vendors
      </button>

      <table style={table}>
        <thead>
          <tr>
            <th style={thTd}>Name</th>
            <th style={thTd}>Company</th>
            <th style={thTd}>Contact</th>
            <th style={thTd}>Aadhar No</th>
            <th style={thTd}>PAN No</th>
            <th style={thTd}>Vendor Type</th>
            <th style={thTd}>Category</th>
            <th style={thTd}>GST</th>
            <th style={thTd}>Registered On</th>
          </tr>
        </thead>

        <tbody>
          {vendors.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: "15px" }}>
                No vendors found
              </td>
            </tr>
          ) : (
            vendors.map((v) => (
              <tr key={v._id}>
                <td style={thTd}>{v.name}</td>
                <td style={thTd}>{v.companyName || "-"}</td>
                <td style={thTd}>{v.contactNo}</td>
                <td style={thTd}>{v.aadharNumber || "-"}</td>
                <td style={thTd}>{v.panNumber || "-"}</td>
                <td style={thTd}>{v.vendorType}</td>
                <td style={thTd}>{v.category}</td>
                <td style={thTd}>{v.gstNumber || "-"}</td>
                <td style={thTd}>
                  {v.createdAt
                    ? new Date(v.createdAt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/* styles */

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "15px",
};

const thTd = {
  border: "1px solid #555",
  padding: "10px",
  fontSize: "14px",
};

const btn = {
  padding: "8px 16px",
  backgroundColor: "#4caf50",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  marginBottom: "10px",
};

export default AdminVendors;
