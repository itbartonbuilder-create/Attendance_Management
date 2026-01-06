import React, { useEffect, useState } from "react";
import "../App.css";

function Workers() {
  const user = JSON.parse(localStorage.getItem("user"));

  /* ================= STATES ================= */
  const [workers, setWorkers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const defaultSites = ["Bangalore", "Japuriya", "Vaishali", "Faridabad", "Other"];

  const roleOptions = {
    Skilled: ["Electrician", "Plumber", "Carpenter"],
    "Semi-Skilled": ["Helper", "Assistant", "Operator"],
    Worker: ["Male", "Female"],
    Other: [],
  };

  const [form, setForm] = useState({
    name: "",
    contactNo: "",
    roleType: "",
    roleTypeCustom: "",
    role: "",
    roleCustom: "",
    site: "",
    siteCustom: "",
    perDaySalary: "",
  });

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
  const fetchWorkers = async () => {
    try {
      const res = await fetch(
        "https://attendance-management-backend-vh2w.onrender.com/api/workers"
      );
      const data = await res.json();
      setWorkers(
        user.role === "manager"
          ? data.filter((w) => w.site === user.site)
          : data
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  /* ================= FORM ================= */
  const resetForm = () => {
    setForm({
      name: "",
      contactNo: "",
      roleType: "",
      roleTypeCustom: "",
      role: "",
      roleCustom: "",
      site: user.role === "manager" ? user.site : "",
      siteCustom: "",
      perDaySalary: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.contactNo)) {
      alert("Enter valid 10 digit contact number");
      return;
    }

    const finalSite =
      form.site === "Other" ? form.siteCustom.trim() : form.site;

    const finalRoleType =
      form.roleType === "Other"
        ? form.roleTypeCustom.trim()
        : form.roleType;

    const finalRole =
      form.role === "Other" ? form.roleCustom.trim() : form.role;

    if (!finalSite || !finalRoleType || !finalRole) {
      alert("All fields required");
      return;
    }

    const payload = {
      name: form.name,
      contactNo: form.contactNo,
      roleType: finalRoleType,
      role: finalRole,
      site: finalSite,
      perDaySalary: form.perDaySalary,
    };

    try {
      if (editingId) {
        await fetch(
          `https://attendance-management-backend-vh2w.onrender.com/api/workers/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        await fetch(
          "https://attendance-management-backend-vh2w.onrender.com/api/workers",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }
      fetchWorkers();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= EDIT / DELETE ================= */
  const editWorker = (w) => {
    setEditingId(w._id);
    setForm({
      name: w.name,
      contactNo: w.contactNo,
      roleType: Object.keys(roleOptions).includes(w.roleType)
        ? w.roleType
        : "Other",
      roleTypeCustom: Object.keys(roleOptions).includes(w.roleType)
        ? ""
        : w.roleType,
      role: roleOptions[w.roleType]?.includes(w.role) ? w.role : "Other",
      roleCustom: roleOptions[w.roleType]?.includes(w.role) ? "" : w.role,
      site: defaultSites.includes(w.site) ? w.site : "Other",
      siteCustom: defaultSites.includes(w.site) ? "" : w.site,
      perDaySalary: w.perDaySalary,
    });
  };

  const deleteWorker = async (id) => {
    if (!window.confirm("Delete worker?")) return;
    await fetch(
      `https://attendance-management-backend-vh2w.onrender.com/api/workers/${id}`,
      { method: "DELETE" }
    );
    fetchWorkers();
  };

  const allSites = [...new Set(workers.map((w) => w.site))];

  /* ================= UI ================= */
  return (
    <div className="workers-container">
      <h2>👷 Workers</h2>

      <form className="workers-form" onSubmit={handleSubmit}>
        <input
          placeholder="Worker Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        {/* ROLE TYPE */}
        <select
          value={form.roleType}
          onChange={(e) =>
            setForm({
              ...form,
              roleType: e.target.value,
              role: "",
              roleTypeCustom: "",
            })
          }
          required
        >
          <option value="">Select Role Type</option>
          {Object.keys(roleOptions).map((rt) => (
            <option key={rt} value={rt}>
              {rt}
            </option>
          ))}
        </select>

        {form.roleType === "Other" && (
          <input
            placeholder="Custom Role Type"
            value={form.roleTypeCustom}
            onChange={(e) =>
              setForm({ ...form, roleTypeCustom: e.target.value })
            }
            required
          />
        )}

        {/* ROLE */}
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
        >
          <option value="">Select Role</option>
          {form.roleType &&
            roleOptions[form.roleType]?.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          <option value="Other">Other</option>
        </select>

        {form.role === "Other" && (
          <input
            placeholder="Custom Role"
            value={form.roleCustom}
            onChange={(e) =>
              setForm({ ...form, roleCustom: e.target.value })
            }
            required
          />
        )}

        {/* SITE */}
        {user.role === "admin" ? (
          <>
            <select
              value={form.site}
              onChange={(e) =>
                setForm({ ...form, site: e.target.value })
              }
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
                placeholder="Custom Site"
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
          onChange={(e) =>
            setForm({ ...form, contactNo: e.target.value })
          }
          maxLength={10}
          required
        />

        <input
          type="number"
          placeholder="Per Day Salary"
          value={form.perDaySalary}
          onChange={(e) =>
            setForm({ ...form, perDaySalary: e.target.value })
          }
          required
        />

        <button type="submit">
          {editingId ? "Update Worker" : "Add Worker"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {/* ================= TABLE ================= */}
      {allSites.map((s) => (
        <div key={s}>
          <h3>🏗 {s}</h3>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role Type</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workers
                .filter((w) => w.site === s)
                .map((w, i) => (
                  <tr key={w._id}>
                    <td>{i + 1}</td>
                    <td>{w.name}</td>
                    <td>{w.roleType}</td>
                    <td>{w.role}</td>
                    <td>{w.contactNo}</td>
                    <td>₹{w.perDaySalary}</td>
                    <td>
                      <button onClick={() => editWorker(w)}>Edit</button>{" "}
                      <button onClick={() => deleteWorker(w._id)}>
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

export default Workers;
