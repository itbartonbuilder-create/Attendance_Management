import React, { useEffect, useState } from "react";

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState(""); 
  const [roleType, setRoleType] = useState("");
  const [role, setRole] = useState("");
  const [site, setSite] = useState("");
  const [perDaySalary, setPerDaySalary] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [sites] = useState(["Bangalore", "Japuriya", "Vashali", "Faridabad"]);

  const roleOptions = {
    Skilled: ["Electrician", "Plumber", "Carpenter"],
    "Semi-Skilled": ["Helper", "Assistant", "Operator"],
    Worker: ["Male", "Female"],
  };

  const fetchWorkers = () => {
    fetch("https://attendance-management-backend-vh2w.onrender.com/api/workers")
      .then((res) => res.json())
      .then((data) => setWorkers(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(contactNo)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    const payload = { name, roleType, role, site, perDaySalary, contactNo };

    if (editingId) {
      
      fetch(`https://attendance-management-backend-vh2w.onrender.com/api/workers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((updatedWorker) => {
          setWorkers(
            workers.map((w) => (w._id === editingId ? updatedWorker : w))
          );
          resetForm();
        })
        .catch((err) => console.error(err));
    } else {
      
      fetch("https://attendance-management-backend-vh2w.onrender.com/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((newWorker) => {
          setWorkers((prev) => [...prev, newWorker]);
          resetForm();
        })
        .catch((err) => console.error(err));
    }
  };

  const resetForm = () => {
    setName("");
    setContactNo("");
    setRoleType("");
    setRole("");
    setSite("");
    setPerDaySalary("");
    setEditingId(null);
  };

  const deleteWorker = (id) => {
    fetch(`https://attendance-management-backend-vh2w.onrender.com/api/workers/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => setWorkers(workers.filter((w) => w._id !== id)))
      .catch((err) => console.error(err));
  };

  const editWorker = (worker) => {
    setName(worker.name);
    setContactNo(worker.contactNo);
    setRoleType(worker.roleType);
    setRole(worker.role);
    setSite(worker.site);
    setPerDaySalary(worker.perDaySalary);
    setEditingId(worker._id);
  };

  return (
    <div className="workers-container">
      <h2>👷 Workers List</h2>

      <form
        onSubmit={handleSubmit}
        style={{ marginBottom: "20px" }}
        className="workers-form"
      >
        <input
          type="text"
          placeholder="Enter worker name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />

      

        <select
          value={roleType}
          onChange={(e) => {
            setRoleType(e.target.value);
            setRole("");
          }}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        >
          <option value="">Select Role Type</option>
          {Object.keys(roleOptions).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          disabled={!roleType}
          style={{ marginRight: "10px", padding: "9px" }}
        >
          <option value="">Select Sub Role</option>
          {roleType &&
            roleOptions[roleType].map((subRole) => (
              <option key={subRole} value={subRole}>
                {subRole}
              </option>
            ))}
        </select>

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
  <input
          type="text"
          placeholder="Enter contact number"
          value={contactNo}
          onChange={(e) => setContactNo(e.target.value)}
          required
          maxLength="10"
          style={{ marginRight: "10px", padding: "9px" }}
        />
        <input
          type="number"
          placeholder="Per Day Salary"
          value={perDaySalary}
          onChange={(e) => setPerDaySalary(e.target.value)}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />

        <button type="submit">
          {editingId ? "Update Worker" : "Add Worker"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        )}
      </form>

      {sites.map((s) => (
        <div key={s}>
          <h3 style={{ marginTop: "20px" }}>🏗 Site: {s}</h3>
          <table
            border="1"
            cellPadding="8"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead style={{ background: "#2C3E50", color: "white" }}>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role Type</th>
                <th>Sub Role</th>
                <th>Site</th>
                <th>Contact No</th> 
                <th>Per Day Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workers
                .filter((w) => w.site === s)
                .map((w, index) => (
                  <tr key={w._id}>
                    <td>{index + 1}</td>
                    <td>{w.name}</td>
                    <td>{w.roleType}</td>
                    <td>{w.role}</td>
                    <td>{w.site}</td>
                    <td>{w.contactNo}</td> 
                    <td>₹{w.perDaySalary}</td>
                    <td>
                      <button
                        onClick={() => editWorker(w)}
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
                        onClick={() => deleteWorker(w._id)}
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

export default Workers;
