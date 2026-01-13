import React from "react";

const VendorDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <h2>Please login</h2>;

  return (
    <div style={{ padding: "100px 30px", color: "white" }}>
      <h1>Welcome, {user.name} 👋</h1>

      <p style={{ marginTop: 10, color: "#ccc", fontSize: 18 }}>
        This is your vendor dashboard.
      </p>

      <div style={{ marginTop: 30 }}>
        <ul style={{ fontSize: 17, lineHeight: "32px" }}>
          <li>✔ Submit new bills</li>
          <li>✔ Track approval status</li>
          <li>✔ View your billing history</li>
        </ul>
      </div>
    </div>
  );
};

export default VendorDashboard;
