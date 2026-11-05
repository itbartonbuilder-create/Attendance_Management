
import React, { useEffect, useMemo, useState } from "react";
import API from "../api";
import "../App.css";

const CATEGORIES = [
  "Civil", "Structural","Wire", "Shuttering", "Masonry", "Plaster", "Flooring",
  "Finishing", "Waterproofing", "Plumbing", "Sanitary", "Electrical",
  "FireFighting", "HVAC", "Aluminium", "Glass", "Carpentry", "Fabrication",
  "Safety", "Tools", "Machinery", "General", "SiteSetup", "QAQC",
  "Logistics", "Labour", "Other",
];
const EMPTY_FORM = {
  supplierName: "",
  category: "",
  description: "",
  amount: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
};
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
})}`;
const dateText = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN");
};

function SupplierRate() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const role = String(
    user?.role || user?.userType || user?.type || user?.designation || ""
  ).toLowerCase().trim();

  const isAdmin = ["admin"].includes(role);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalSuppliers: 0,
    totalCategories: 0,
    totalAmount: 0,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;

      const [listRes, summaryRes] = await Promise.all([
        API.get("/supplier-rates", { params }),
        API.get("/supplier-rates/summary"),
      ]);

      setRows(listRes.data?.data || []);

      setSummary(
        summaryRes.data?.data || {
          totalRecords: 0,
          totalSuppliers: 0,
          totalCategories: 0,
          totalAmount: 0,
        }
      );
    } 
    catch (err) {
     console.error("Supplier Rate fetch error:", err);

      setError(
        err.response?.data?.message ||
        "Supplier records not load. "
      );
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      purchaseDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId("");
  };
  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };
  const openEditForm = (row) => {
    setEditingId(row._id);
    setForm({
      supplierName: row.supplierName || "",
      category: row.category || "",
      description: row.description || "",
      amount: String(row.amount ?? ""),
      purchaseDate: row.purchaseDate
        ? new Date(row.purchaseDate).toISOString().slice(0, 10)
        : "",
    });

    setShowForm(true);
  };

  const changeField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value, }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (
      !form.supplierName.trim() ||
      !form.category ||
      !form.description.trim() ||
      form.amount === "" ||
      !form.purchaseDate
    ) 
    {
      alert("Please fill all required fields.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const payload = {
      supplierName: form.supplierName.trim(),
      category: form.category,
      description: form.description.trim(),
      amount,
      purchaseDate: form.purchaseDate,
    };

    try {
      setSaving(true);

      if (editingId) {
        await API.put(`/supplier-rates/${editingId}`, payload);
        alert("Supplier record updated successfully.");
      } else {
        await API.post("/supplier-rates", payload);
        alert("Supplier record added successfully.");
      }

      setShowForm(false);
      resetForm();

      await fetchData();
    } 
    catch (err) {
      console.error("Supplier Rate save error:", err);

      alert(
        err.response?.data?.message ||
        "Supplier record save nahi ho paya."
      );
    } 
    finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (row) => {
    if (
      !window.confirm(
        `Delete record for ${row.supplierName}?`
      )
    ) return;

    try {
      await API.delete(`/supplier-rates/${row._id}`);
      await fetchData();
      alert("Supplier record deleted successfully.");
    } 
    catch (err) {
      alert(
        err.response?.data?.message ||
        "Record delete nahi hua."
      );
    }
  };

  return (
    <div className="sr-page">
      <div className="sr-header">
        <div>
        <h1>Supplier Rate</h1>
        <p>Supplier and purchase amount records</p>
        </div>
        <button type="button" className="sr-primary-btn" onClick={openAddForm}>
        <span>＋</span> Add Supplier
        </button>
      </div>

      <div className="sr-stat-grid">
        <div className="sr-stat-card">
        <span>Total Suppliers</span>
        <strong>{summary.totalSuppliers}</strong>
        <small>Unique supplier names</small>
        </div>

        <div className="sr-stat-card">
        <span>Total Records</span>
        <strong>{summary.totalRecords}</strong>
        <small>Saved purchase records</small>
        </div>

        <div className="sr-stat-card">
        <span>Total Categories</span>
        <strong>{summary.totalCategories}</strong>
        <small>Different categories</small>
        </div>

        {/* <div className="sr-stat-card">
        <span>Total Amount</span>
        <strong>{money(summary.totalAmount)}</strong>
        <small>Total recorded amount</small>
        </div> */}
      </div>

      {error && (
        <div className="sr-alert">{error}</div>
      )}   
      <section className="sr-panel">
        <div className="sr-filter-grid">
          <label className="sr-search">
            <span>Search Supplier / Description</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search supplier or description..." />
          </label>

          <label>
            <span>Category</span>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}> {category}</option>
              ))}
            </select>
          </label>

        </div>

        <div className="sr-table-heading">
          <div> <h2>Supplier Records</h2>
            <p>Supplier details and purchase amounts.</p>
          </div>
          <span className="sr-count">  {rows.length} records </span>
        </div>

        {loading ? (
          <div className="sr-empty"> Loading supplier records... </div>
        ) : rows.length === 0 ? (
          <div className="sr-empty">
            <strong>No supplier records found</strong>
            <span>Add a supplier record or change your search filters.</span>
          </div>
        ) : (
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                <th>S. No.</th>
                <th>Supplier / Company</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Purchase Date</th>
                <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row._id}>
                    <td>{index + 1}</td>
                    <td> <strong>{row.supplierName}</strong></td>
                    <td>{row.category}</td>
                    <td>{row.description}</td>
                    <td> <strong className="sr-rate">{money(row.amount)}</strong></td>
                    <td>{dateText(row.purchaseDate)}</td>
                    <td><div className="sr-actions"> {row.canEdit && (
                      <button type="button" className="sr-action-btn" onClick={() => openEditForm(row)} >  Edit</button>)}
                      {row.canDelete && (
                      <button type="button" className="sr-action-btn danger" onClick={() => deleteRecord(row)} > Delete </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {showForm && (
        <div className="sr-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) {
          setShowForm(false); }}}>
          <form className="sr-modal" onSubmit={submitForm}>
            <div className="sr-modal-header">
              <div>
                <h2> {editingId ? "Edit Supplier" : "Add Supplier"} </h2>
                <p>Enter supplier and purchase details.</p>
              </div>
              <button type="button" className="sr-close" onClick={() => setShowForm(false)} >× </button>
            </div>
            <div className="sr-form-grid">
              <label>
                <span>Supplier / Company Name *</span>
                <input name="supplierName" value={form.supplierName} onChange={changeField}
                placeholder="Enter supplier name" required />
              </label>
              <label>
                  <span>Category *</span>
                    <select name="category" value={form.category} onChange={changeField} required>
                    <option value="">Select Category</option>
                    {CATEGORIES.map((category) => (
                    <option key={category} value={category}> {category} </option> ))}
                    </select>
              </label>
              <label className="sr-full">
                <span>Description *</span>
                <textarea name="description" value={form.description} onChange={changeField}
                 placeholder="Enter purchase or material description" rows="3" required/>
              </label>
              <label>
                <span>Amount (₹) *</span>
                <input type="number" min="0" step="0.01" name="amount" value={form.amount}
                onChange={changeField} placeholder="Enter amount" required />
              </label>
              <label>
                <span>Purchase Date *</span>
                <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={changeField}
                required />
              </label>

            </div>
            <div className="sr-modal-footer">
              <button type="button" className="sr-secondary-btn" onClick={() => { setShowForm(false);
              resetForm();}} > Cancel </button>
              <button type="submit" className="sr-primary-btn" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Supplier" : "Save Supplier"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default SupplierRate;
