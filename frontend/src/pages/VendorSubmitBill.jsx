import React from "react";
import BillForm from "../components/BillForm";

const VendorSubmitBill = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ paddingTop: "90px" }}>
      <BillForm vendorId={user._id} />
    </div>
  );
};

export default VendorSubmitBill;
