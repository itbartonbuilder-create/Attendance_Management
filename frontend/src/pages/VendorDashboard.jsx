import React from "react";
import BillForm from "../components/BillForm";

const VendorDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <h2>Please login</h2>;

  return (
    <div className="vendor-container">
      <h2>Welcome Vendor: {user.name}</h2>
      <BillForm vendorId={user._id} />
    </div>
  );
};

export default VendorDashboard;
