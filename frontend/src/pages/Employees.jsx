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
    siteCustom: "",
  });
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const defaultSites = ["Bangalore", "Japuriya", "Vashali", "Faridabad", "Other"];
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      alert("❌ You are not authorized!");
      window.location.href = "/login";
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/employees"
      );
      const empArray = Array.isArray(res.data) ? res.data : [];
      if (user.role === "manager") {
        setEmployees(empArray.filter((e) => e.site === user.site));
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

  const resetForm = () => {
    setForm({
      name: "",
      role: "",
      site: "",
      siteCustom: "",
      contactNo: "",
      salary: "",
    });
    setAadhaarFile(null);
    setPanFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.contactNo)) {
      alert("Enter valid 10-digit contact number");
      return;
    }

    const finalSite =
      form.site === "Other" && form.siteCustom ? form.siteCustom : form.site;

    if (!finalSite) {
      alert("Please select or enter a site");
      return;
    }

    const data = new FormData();
    data.append("name", form.name);
    data.append("role", form.role);
    data.append("site", finalSite);
    data.append("contactNo", form.contactNo);
    data.append("salary", form.salary);

    if (aadhaarFile) data.append("aadhaar", aadhaarFile);
    if (panFile) data.append("pan", panFile);

    try {
      if (editingId) {
        await axios.put(
          `https://attendance-management-backend-vh2w.onrender.com/api/employees/${editingId}`,
          data
        );
      } else {
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

  const editEmployee = (emp) => {
    if (user.role === "manager" && emp.site !== user.site) {
      alert("❌ You cannot edit employees from another site!");
      return;
    }
    setForm({
      name: emp.name,
      role: emp.role,
      site: defaultSites.includes(emp.site) ? emp.site : "Other",
      siteCustom: !defaultSites.includes(emp.site) ? emp.site : "",
      contactNo: emp.contactNo,
      salary: emp.salary,
    });
    setEditingId(emp._id);
  };

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
      console.error(err);
    }
  };

  // Dynamically get all unique site names from employees
  const allSites = [
    ...new Set(employees.map((e) => e.site))
  ];

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
              {defaultSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {form.site === "Other" && (
              <input
                type="text"
                placeholder="Enter site name"
                value={form.siteCustom}
                onChange={(e) =>
                  setForm({ ...form, siteCustom: e.target.value })
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

      {/* Employee tables per site */}
      {allSites.map((siteName) => (
        <div key={siteName}>
          <h3 style={{ marginTop: "20px" }}>🏗 Site: {siteName}</h3>
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
              {employees
                .filter((e) => e.site === siteName)
                .map((emp, index) => (
                  <tr key={emp._id}>
                    <td>{index + 1}</td>
                    <td>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>{emp.site}</td>
                    <td>{emp.contactNo}</td>
                    <td>₹{emp.salary}</td>
                    <td>
                      {emp.aadhaarDoc ? (
                        <a
                          href={`https://attendance-management-backend-vh2w.onrender.com/${emp.aadhaarDoc}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {emp.panDoc ? (
                        <a
                          href={`https://attendance-management-backend-vh2w.onrender.com/${emp.panDoc}`}
                          target="_blank"
                          rel="noreferrer"
                        >
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
