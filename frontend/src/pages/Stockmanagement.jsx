import React, { useState } from "react";

const MATERIALS = {
  Steel: [
    { name: "Reinforcement 8mm", unit: "Bundle" },
    { name: "Reinforcement 10mm", unit: "Bundle" },
    { name: "Reinforcement 12mm", unit: "Bundle" },
    { name: "Reinforcement 16mm", unit: "Bundle" },
    { name: "Binding Wire", unit: "Kg" },
  ],
  Civil: [
    { name: "Cement", unit: "Bag" },
    { name: "Sand", unit: "CFT" },
    { name: "Aggregate 20mm", unit: "CFT" },
    { name: "Bricks", unit: "Nos" },
  ],
  Shuttering: [
    { name: "Plates", unit: "Nos" },
    { name: "Props", unit: "Nos" },
    { name: "Pipes", unit: "Nos" },
  ],
  Electrical: [
    { name: "Wire", unit: "Meter" },
    { name: "Switch", unit: "Nos" },
    { name: "MCB", unit: "Nos" },
  ],
  Plumbing: [
    { name: "Pipe", unit: "Feet" },
    { name: "Elbow", unit: "Nos" },
    { name: "Tap", unit: "Nos" },
  ],
};

function StockManagement() {
  const user = JSON.parse(localStorage.getItem("user"));
  const managerSite = user?.site || "";

  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState({ total: "", used: "" });

  const [stocks, setStocks] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);

  const remaining =
    Number(stock.total || 0) - Number(stock.used || 0);

  // 📥 Fetch stocks
  const fetchStocks = async () => {
    const res = await fetch(
      `https://attendance-management-backend-vh2w.onrender.com/api/stocks?site=${managerSite}`
    );
    const data = await res.json();
    setStocks(data.data || []);
  };

  // 🎯 Material select
  const handleMaterialChange = (value) => {
    const selected = MATERIALS[category]?.find(
      (m) => m.name === value
    );
    setMaterial(value);
    setUnit(selected.unit);
  };

  // 💾 Save stock
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (remaining < 0) {
      alert("Used stock cannot be greater than total");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://attendance-management-backend-vh2w.onrender.com/api/stocks/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site: managerSite,
            category,
            material,
            unit,
            addStock: Number(stock.total),   // ✅ FIXED
            usedStock: Number(stock.used),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Stock Saved Successfully");

      fetchStocks();

      // 🔄 Reset form
      setCategory("");
      setMaterial("");
      setUnit("");
      setStock({ total: "", used: "" });
    } catch (err) {
      alert(err.message || "Error saving stock");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStock = () => {
    if (!showTable) fetchStocks();
    setShowTable(!showTable);
  };

  return (
    <div style={containerStyle}>
      <h2>🏗️ Stock Management ({managerSite})</h2>

      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <label>Site</label>
          <input value={managerSite} disabled style={input} />
        </div>

        <div style={sectionStyle}>
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setMaterial("");
            }}
            required
          >
            <option value="">Select</option>
            {Object.keys(MATERIALS).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {category && (
          <div style={sectionStyle}>
            <label>Material</label>
            <select
              value={material}
              onChange={(e) =>
                handleMaterialChange(e.target.value)
              }
              required
            >
              <option value="">Select</option>
              {MATERIALS[category].map((m) => (
                <option key={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {material && (
          <div style={cardStyle}>
            <input
              type="number"
              placeholder={`Total (${unit})`}
              value={stock.total}
              onChange={(e) =>
                setStock({ ...stock, total: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder={`Used (${unit})`}
              value={stock.used}
              onChange={(e) =>
                setStock({ ...stock, used: e.target.value })
              }
              required
            />
            <p>
              Remaining: <b>{remaining}</b> {unit}
            </p>
          </div>
        )}

        <button style={btnStyle} disabled={loading}>
          {loading ? "Saving..." : "Save Stock"}
        </button>
      </form>

      <button style={viewBtn} onClick={handleViewStock}>
        {showTable ? "Hide Stock" : "View My Site Stock"}
      </button>

      {showTable && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Site</th>
              <th>Category</th>
              <th>Material</th>
              <th>Total</th>
              <th>Used</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s._id}>
                <td>
                  {new Date(s.date).toLocaleDateString()}
                </td>
                <td>{s.site}</td>
                <td>{s.category}</td>
                <td>{s.material}</td>
                <td>{s.totalStock}</td>
                <td>{s.usedStock}</td>
                <td>{s.remainingStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StockManagement;

/* ---------- Styles ---------- */

const containerStyle = {
  maxWidth: 1200,
  margin: "80px auto",
  padding: 20,
  background: "#333",
  color: "#fff",
  borderRadius: 8,
};

const input = {
  padding: "12px 15px",
  margin: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
};

const sectionStyle = {
  marginBottom: 12,
  display: "flex",
  flexDirection: "column",
};

const cardStyle = {
  background: "#444",
  padding: 15,
  borderRadius: 6,
  marginBottom: 15,
};

const btnStyle = {
  padding: "10px 20px",
  background: "#2ecc71",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const viewBtn = {
  marginTop: 30,
  padding: "10px 20px",
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  marginTop: 20,
  borderCollapse: "collapse",
  background: "#222",
};
