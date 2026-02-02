import React, { useState } from "react";

/* ===== MATERIAL MASTER (CONSTRUCTION STANDARD) ===== */
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
  const [site, setSite] = useState("");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [unit, setUnit] = useState("");

  const [stock, setStock] = useState({
    total: "",
    used: "",
  });

  const remaining =
    Number(stock.total || 0) - Number(stock.used || 0);

  const handleMaterialChange = (value) => {
    const selected = MATERIALS[category].find(
      (m) => m.name === value
    );
    setMaterial(value);
    setUnit(selected.unit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      site,
      category,
      material,
      unit,
      totalStock: Number(stock.total),
      usedStock: Number(stock.used),
      remainingStock: remaining,
    };

    console.log("📦 STOCK DATA:", data);
    alert("Stock Saved Successfully ✅");
  };

  return (
    <div style={containerStyle}>
      <h2>🏗️ Construction Stock Management</h2>

      <form onSubmit={handleSubmit}>
        {/* SITE */}
        <div style={sectionStyle}>
          <label>Site</label>
          <select value={site} onChange={(e) => setSite(e.target.value)} required>
            <option value="">Select Site</option>
            <option>Bangalore</option>
            <option>Japuriya</option>
            <option>Vaishali</option>
            <option>Faridabad</option>
          </select>
        </div>

        {/* CATEGORY */}
        <div style={sectionStyle}>
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setMaterial("");
              setStock({ total: "", used: "" });
            }}
            required
          >
            <option value="">Select Category</option>
            {Object.keys(MATERIALS).map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* MATERIAL */}
        {category && (
          <div style={sectionStyle}>
            <label>Material</label>
            <select
              value={material}
              onChange={(e) => handleMaterialChange(e.target.value)}
              required
            >
              <option value="">Select Material</option>
              {MATERIALS[category].map((m) => (
                <option key={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* STOCK DETAILS */}
        {material && (
          <div style={cardStyle}>
            <h4>Stock Details ({unit})</h4>

            <div style={inputRow}>
              <input
                type="number"
                placeholder={`Total Stock (${unit})`}
                value={stock.total}
                onChange={(e) =>
                  setStock({ ...stock, total: e.target.value })
                }
                required
              />

              <input
                type="number"
                placeholder={`Used Stock (${unit})`}
                value={stock.used}
                onChange={(e) =>
                  setStock({ ...stock, used: e.target.value })
                }
                required
              />
            </div>

            <p style={{ marginTop: 10 }}>
              Remaining Stock:{" "}
              <b style={{ color: remaining < 0 ? "red" : "#2ecc71" }}>
                {remaining} {unit}
              </b>
            </p>
          </div>
        )}

        <button type="submit" style={btnStyle}>
          Save Stock
        </button>
      </form>
    </div>
  );
}

/* ================= STYLES ================= */

const containerStyle = {
  maxWidth: 1180,
  margin: "128px auto",
  padding: 20,
  background: "#333",
  color: "#fff",
  borderRadius: 8,
};

const sectionStyle = {
  marginBottom: 15,
  display: "flex",
  flexDirection: "column",
};

const cardStyle = {
  background: "#444",
  padding: 15,
  borderRadius: 6,
  marginBottom: 15,
};

const inputRow = {
  display: "flex",
  gap: 10,
  marginTop: 10,
};

const btnStyle = {
  marginTop: 20,
  padding: "10px 20px",
  background: "#2C3E50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

export default StockManagement;
