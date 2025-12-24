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

  if (loading) return <h2>Loading vendors...</h2>;

  return (
    <div style={{ padding: "30px", color: "white" }}>
      <h2>All Registered Vendors</h2>

      <table style={table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Contact</th>
            <th>Vendor Type</th>
            <th>Category</th>
            <th>GST</th>
            <th>Registered On</th>
          </tr>
        </thead>

        <tbody>
          {vendors.map((v) => (
            <tr key={v._id}>
              <td>{v.name}</td>
              <td>{v.companyName || "-"}</td>
              <td>{v.contactNo}</td>
              <td>{v.vendorType}</td>
              <td>{v.category}</td>
              <td>{v.gstNumber || "-"}</td>
              <td>{new Date(v.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

export default AdminVendors;
