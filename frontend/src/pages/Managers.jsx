import React, { useEffect, useState } from "react";
import API from "../api";
import "../App.css";


function Managers() {
  const defaultSites = ["Kashipur", "Japuriya", "Gwailor", "Gaya","jim corbett","Gunna","Office", "Other"];
  const [user, setUser] = useState(null);
  const [managers, setManagers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNo: "",
    site: "",
    siteCustom: "",
  });
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser || savedUser.role.toLowerCase() !== "admin") {
      alert("❌ Unauthorized");
      window.location.href = "/login";
      return;
    }
    setUser(savedUser);
  }, []);


  const fetchManagers = async () => {
    if (!user) return;
    try {
      const res = await API.get(
        "/managers"
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setManagers(data);
    } catch (err) {
      console.error(err);
      setManagers([]);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [user]);


  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      contactNo: "",
      site: "",
      siteCustom: "",
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

    const finalSite = form.site === "Other" ? form.siteCustom.trim() : form.site;

    if (!finalSite) {
      alert("Site required");
      return;
    }

    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("contactNo", form.contactNo);
    data.append("site", finalSite);
    if (aadhaarFile) data.append("aadhaar", aadhaarFile);
    if (panFile) data.append("pan", panFile);

    try {
      if (editingId) {
        await API.put(
          `/managers/${editingId}`,
          data
        );
      } else {
        await API.post(
          "/managers",
          data
        );
      }
      fetchManagers();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const editManager = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name,
      email: m.email,
      contactNo: m.contactNo,
      site: defaultSites.includes(m.site) ? m.site : "Other",
      siteCustom: defaultSites.includes(m.site) ? "" : m.site,
    });
  };

  const deleteManager = async (id) => {
    if (!window.confirm("Delete manager?")) return;
    try {
      await API.delete(
        `/managers/${id}`
      );
      fetchManagers();
    } catch (err) {
      console.error(err);
    }
  };

  const allSites = [...new Set(managers.map((m) => m.site))];


  return (
    <div className="workers-container">
      <h2>👨‍💼 Managers</h2>

      <form className="workers-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Manager Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          placeholder="Contact Number"
          value={form.contactNo}
          onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
          maxLength={10}
          required
        />

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
            onChange={(e) => setForm({ ...form, siteCustom: e.target.value })}
            required
          />
        )}

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
          {editingId ? "Update Manager" : "Add Manager"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {allSites.map((site) => (
        <div key={site}>
          <h3>🏗 {site}</h3>

          <table border="1" width="100%">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Aadhaar</th>
                <th>PAN</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {managers
                .filter((m) => m.site === site)
                .map((m, i) => (
                  <tr key={m._id}>
                    <td>{i + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.contactNo}</td>

                    <td>
                      {m.aadhaarDoc?.url ? (
                        <a href={m.aadhaarDoc.url} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      {m.panDoc?.url ? (
                        <a href={m.panDoc.url} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      <button onClick={() => editManager(m)}>Edit</button>{" "}
                      <button onClick={() => deleteManager(m._id)}>Delete</button>
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
