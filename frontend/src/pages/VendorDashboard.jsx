import React from "react";
import BillForm from "../components/BillForm";

const VendorDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="vendor-container">
      <h2>Welcome Vendor: {user?.name}</h2>
      <BillForm />
    </div>
  );
};

export default VendorDashboard;
