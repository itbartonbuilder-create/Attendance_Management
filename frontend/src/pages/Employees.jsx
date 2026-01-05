import React, { useEffect, useState } from "react";
import "../App.css";
import axios from "axios";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    role: "",
    site: "",
    contactNo: "",
    salary: "",
  });
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const sites = ["Bangalore", "Japuriya", "Vashali", "Faridabad", "Other"];
  const user = JSON.parse(localStorage.getItem("user"));

  // Check authorization
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      alert("❌ You are not authorized to access this page!");
      window.location.href = "/login";
    }
  }, [user]);

  // Fetch employees safely
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/employees"
      );
      const empArray = Array.isArray(res.data.employees) ? res.data.employees : [];
      if (user.role === "manager") {
        const filtered = empArray.filter((e) => e.site === user.site);
        setEmployees(filtered);
      } else {
        setEmployees(empArray);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Reset form
  const resetForm = () => {
    setForm({ name: "", role: "", site: "", contactNo: "", salary: "" });
    setAadhaarFile(null);
    setPanFile(null);
    setEditingId(null);
  };

  // Submit (Add / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.contactNo)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    if (!form.site) {
      alert("Please select a site.");
      return;
    }

    const data = new FormData();
    Object.keys(form).forEach((key) => data.append(key, form[key]));
    if (aadhaarFile) data.append("aadhaar", aadhaarFile);
    if (panFile) data.append("pan", panFile);

    try {
      if (editingId) {
        // Update employee
        await axios.put(
          `https://attendance-management-backend-vh2w.onrender.com/api/employees/${editingId}`,
          data
        );
      } else {
        // Add employee
        await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/employees",
          data
        );
      }
      fetchEmployees();
      resetForm();
    } catch (err) {
      console.error("Error adding/updating employee:", err);
    }
  };

  // Edit employee
  const editEmployee = (emp) => {
    if (user.role === "manager" && emp.site !== user.site) {
      alert("❌ You cannot edit employees from another site!");
      return;
    }

    setForm({
      name: emp.name,
      role: emp.role,
      site: sites.includes(emp.site) ? emp.site : "Other",
      contactNo: emp.contactNo,
      salary: emp.salary,
    });
    setEditingId(emp._id);
  };

  // Delete employee
  const deleteEmployee = async (id) => {
    const emp = employees.find((e) => e._id === id);
    if (user.role === "manager" && emp.site !== user.site) {
      alert("❌ You cannot delete employees from another site!");
      return;
    }

    try {
      await axios.delete(
        `https://attendance-management-backend-vh2w.onrender.com/api/employees/${id}`
      );
      setEmployees(employees.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  // Display sites (for manager: only their site)
  const displaySites =
    user.role === "manager" ? [user.site] : sites;

  return (
    <div className="workers-container">
      <h2>👨‍💼 Employees</h2>

      <form
        onSubmit={handleSubmit}
        className="workers-form"
        style={{ marginBottom: "20px" }}
      >
        <input
          type="text"
          placeholder="Enter employee name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />

        <input
          type="text"
          placeholder="Enter role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />

        {user.role === "admin" && (
          <>
            <select
              value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
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
            {form.site === "Other" && (
              <input
                type="text"
                placeholder="Enter site name"
                onChange={(e) =>
                  setForm({ ...form, site: e.target.value })
                }
                required
                style={{ marginRight: "10px", padding: "9px" }}
              />
            )}
          </>
        )}

        <input
          type="text"
          placeholder="Contact Number"
          value={form.contactNo}
          onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
          required
          maxLength="10"
          style={{ marginRight: "10px", padding: "9px" }}
        />

        <input
          type="number"
          placeholder="Salary"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          required
          style={{ marginRight: "10px", padding: "9px" }}
        />

        <label>
          Aadhaar:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAadhaarFile(e.target.files[0])}
            style={{ marginRight: "10px" }}
          />
        </label>

        <label>
          PAN:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPanFile(e.target.files[0])}
            style={{ marginRight: "10px" }}
          />
        </label>

        <button type="submit">
          {editingId ? "Update Employee" : "Add Employee"}
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

      {/* Employee table grouped by site */}
      {displaySites.map((s) => (
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
                <th>Role</th>
                <th>Site</th>
                <th>Contact No</th>
                <th>Salary</th>
                <th>Aadhaar</th>
                <th>PAN</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(employees) &&
                employees
                  .filter(
                    (e) =>
                      e.site === s ||
                      (s === "Other" && !sites.includes(e.site))
                  )
                  .map((emp, index) => (
                    <tr key={emp._id}>
                      <td>{index + 1}</td>
                      <td>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>{emp.site}</td>
                      <td>{emp.contactNo}</td>
                      <td>₹{emp.salary}</td>
                      <td>
                        {emp.aadhaarUrl ? (
                          <a href={emp.aadhaarUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        {emp.panUrl ? (
                          <a href={emp.panUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => editEmployee(emp)}
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
                          onClick={() => deleteEmployee(emp._id)}
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

export default Employees;
