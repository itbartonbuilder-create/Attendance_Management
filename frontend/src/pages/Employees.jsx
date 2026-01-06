import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

function Employees() {
  const user = JSON.parse(localStorage.getItem("user"));
  const defaultSites = ["Bangalore", "Japuriya", "Vaishali", "Faridabad", "Other"];

  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    site: "",
    siteCustom: "",
    contactNo: "",
    salary: "",
  });
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      alert("❌ Unauthorized");
      window.location.href = "/login";
    }
    if (user?.role === "manager") {
      setForm((prev) => ({ ...prev, site: user.site }));
    }
  }, [user]);

  /* ================= FETCH ================= */
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/employees"
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setEmployees(
        user.role === "manager"
          ? data.filter((e) => e.site === user.site)
          : data
      );
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  /* ================= FORM ================= */
  const resetForm = () => {
    setForm({
      name: "",
      role: "",
      site: user.role === "manager" ? user.site : "",
      siteCustom: "",
      contactNo: "",
      salary: "",
    });
    setEditingId(null);
    setAadhaarFile(null);
    setPanFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.contactNo)) {
      alert("Enter valid 10 digit number");
      return;
    }

    const finalSite =
      form.site === "Other" ? form.siteCustom.trim() : form.site;

    if (!finalSite) {
      alert("Site required");
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
      console.error(err);
    }
  };

  /* ================= EDIT / DELETE ================= */
  const editEmployee = (emp) => {
    setEditingId(emp._id);
    setForm({
      name: emp.name,
      role: emp.role,
      site: defaultSites.includes(emp.site) ? emp.site : "Other",
      siteCustom: defaultSites.includes(emp.site) ? "" : emp.site,
      contactNo: emp.contactNo,
      salary: emp.salary,
    });
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete employee?")) return;
    try {
      await axios.delete(
        `https://attendance-management-backend-vh2w.onrender.com/api/employees/${id}`
      );
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const allSites = [...new Set(employees.map((e) => e.site))];

  /* ================= UI ================= */
  return (
    <div className="workers-container">
      <h2>👨‍💼 Employees</h2>

      <form className="workers-form" onSubmit={handleSubmit}>
        <input
          placeholder="Employee Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
        />

        {user.role === "admin" ? (
          <>
            <select
              value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
              required
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
                placeholder="Custom Site Name"
                value={form.siteCustom}
                onChange={(e) =>
                  setForm({ ...form, siteCustom: e.target.value })
                }
                required
              />
            )}
          </>
        ) : (
          <input value={user.site} readOnly />
        )}

        <input
          placeholder="Contact Number"
          value={form.contactNo}
          onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
          maxLength={10}
          required
        />

        <input
          placeholder="Salary"
          type="number"
          value={form.salary}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          required
        />

        <label>
          Aadhaar Card:
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setAadhaarFile(e.target.files[0])}
          />
        </label>

        <label>
          PAN Card:
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPanFile(e.target.files[0])}
          />
        </label>

        <button type="submit">
          {editingId ? "Update Employee" : "Add Employee"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {/* ================= TABLE ================= */}
      {allSites.map((site) => (
        <div key={site}>
          <h3>🏗 {site}</h3>

          <table border="1" width="100%">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Salary</th>
                <th>Aadhaar</th>
                <th>PAN</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees
                .filter((e) => e.site === site)
                .map((emp, i) => (
                  <tr key={emp._id}>
                    <td>{i + 1}</td>
                    <td>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>{emp.contactNo}</td>
                    <td>₹{emp.salary}</td>

                    {/* ✅ CLOUDINARY URL */}
                    <td>
                      {emp.aadhaarDoc?.url ? (
                        <a
                          href={emp.aadhaarDoc.url}
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
                      {emp.panDoc?.url ? (
                        <a
                          href={emp.panDoc.url}
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
                      <button onClick={() => editEmployee(emp)}>Edit</button>{" "}
                      <button onClick={() => deleteEmployee(emp._id)}>
                        Delete
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
