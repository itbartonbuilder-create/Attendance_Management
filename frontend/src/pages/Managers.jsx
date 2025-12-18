import React, { useEffect, useState } from "react";
import "../App.css";

function Managers() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [managers, setManagers] = useState([]);
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [error, setError] = useState("");

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoadingUser(false);
  }, []);

  // Fetch managers
  const fetchManagers = () => {
    setLoadingManagers(true);
    fetch("https://attendance-management-backend-vh2w.onrender.com/api/managers")
      .then((res) => res.json())
      .then((data) => setManagers(data))
      .catch((err) => setError("Error fetching managers"))
      .finally(() => setLoadingManagers(false));
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // Handle add/update manager
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(contactNo)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    const payload = { name, email, contactNo, site };

    if (editingId) {
      fetch(`https://attendance-management-backend-vh2w.onrender.com/api/managers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((updated) => {
          setManagers(managers.map((m) => (m._id === editingId ? updated : m)));
          resetForm();
        })
        .catch((err) => console.error("Error updating manager:", err));
    } else {
      fetch("https://attendance-management-backend-vh2w.onrender.com/api/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((newManager) => {
          setManagers((prev) => [...prev, newManager]);
          resetForm();
        })
        .catch((err) => console.error("Error adding manager:", err));
    }
  };

  const resetForm = () => {
    setName("");
    setContactNo("");
    setEmail("");
    setSite("");
    setEditingId(null);
  };

  const deleteManager = (id) => {
    fetch(`https://attendance-management-backend-vh2w.onrender.com/api/managers/${id}`, {
      method: "DELETE",
    })
      .then(() => setManagers(managers.filter((m) => m._id !== id)))
      .catch((err) => console.error("Error deleting manager:", err));
  };

  const editManager = (manager) => {
    setName(manager.name);
    setEmail(manager.email);
    setContactNo(manager.contactNo);
    setSite(manager.site);
    setEditingId(manager._id);
  };

  // Render loading or access check
  if (loadingUser) return <p>Loading...</p>;
  if (!user || user.role.toLowerCase() !== "admin") return <p>Access Denied</p>;

  return (
    <div className="workers-container">
      <h2>👨‍💼 Managers List</h2>

      <form onSubmit={handleSubmit} className="workers-form" style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter manager name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />
        <input
          type="text"
          placeholder="Enter contact number"
          value={contactNo}
          onChange={(e) => setContactNo(e.target.value)}
          required
          maxLength="10"
          style={{ marginRight: "10px", padding: "9px" }}
        />
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        >
          <option value="">Select Site</option>
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button type="submit">{editingId ? "Update Manager" : "Add Manager"}</button>
        {editingId && (
          <button type="button" onClick={resetForm} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        )}
      </form>

      {loadingManagers && <p>Loading managers...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {sites.map((s) => (
        <div key={s}>
          <h3 style={{ marginTop: "20px" }}>🏗 Site: {s}</h3>
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#2C3E50", color: "white" }}>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Site</th>
                <th>Contact No</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {managers
                .filter((m) => m.site === s)
                .map((m, index) => (
                  <tr key={m._id}>
                    <td>{index + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.site}</td>
                    <td>{m.contactNo}</td>
                    <td>
                      <button
                        onClick={() => editManager(m)}
                        style={{
                          background: "#3498db",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          marginRight: "5px",
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteManager(m._id)}
                        style={{
                          background: "#e74c3c",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                      >
                        ❌ Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default Managers;
