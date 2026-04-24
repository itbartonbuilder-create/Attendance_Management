import React, { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) return <p>⚠️ Please login first.</p>;

  return (
    <div className="profile-container">
      <h2>👤 {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Profile</h2>
      <div className="profile-card">
        <p><strong>Name:</strong> {user.name}</p>

     
        {user.role === "admin" && <p><strong>Email:</strong> {user.email}</p>}

        
        {(user.role === "manager" || user.role === "worker") && (
          <p><strong>Site:</strong> {user.site || "N/A"}</p>
        )}

        <p><strong>Role:</strong> {user.role}</p>
      </div>
    </div>
  );
}

export default Profile;
