import React, { useState } from "react";

const MATERIALS = {
  Steel: [
    { name: "Reinforcement 8mm", unit: "Bundle" },
    { name: "Reinforcement 10mm", unit: "Bundle" },
    { name: "Reinforcement 12mm", unit: "Bundle" },
    { name: "Reinforcement 16mm", unit: "Bundle" },
    { name: "Reinforcement 20mm", unit: "Bundle" },
    { name: "Reinforcement 25mm", unit: "Bundle" },
    { name: "Binding Wire", unit: "Kg" },
  ],
  Civil: [
    { name: "Cement", unit: "Bag" },
    { name: "Sand", unit: "CFT" },
    { name: "Aggregate 20mm", unit: "CFT" },
    { name: "Bricks", unit: "Nos" },
  ],
};

function StockManagement() {
  const user = JSON.parse(localStorage.getItem("user"));
  const managerSite = user?.site || "";

  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [unit, setUnit] = useState("");

  const [stock, setStock] = useState({
    add: "",
    used: "",
  });

  const [stocks, setStocks] = useState([]);
  const [showTable, setShowTable] = useState(false);

  // ================= FETCH STOCK =================

  const fetchStocks = async () => {
    const res = await fetch(
      `https://attendance-management-backend-vh2w.onrender.com/api/stocks?site=${managerSite}`
    );
    const data = await res.json();
    setStocks(data.data || []);
  };

  // ================= MATERIAL SELECT =================

  const handleMaterialChange = (value) => {
    const selected = MATERIALS[category]?.find((m) => m.name === value);
    if (!selected) return;
    setMaterial(value);
    setUnit(selected.unit);
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const addStock = Number(stock.add || 0);
    const usedStock = Number(stock.used || 0);

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
            addStock,
            usedStock,
          }),
        }
      );

      if (!res.ok) throw new Error();

      alert("✅ Stock Updated");

      fetchStocks();

      setStock({ add: "", used: "" });
      setMaterial("");
    } catch {
      alert("❌ Error saving stock");
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
        {/* CATEGORY */}
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

        {/* MATERIAL */}
        {category && (
          <div style={sectionStyle}>
            <label>Material</label>
            <select
              value={material}
              onChange={(e) => handleMaterialChange(e.target.value)}
              required
            >
              <option value="">Select</option>
              {MATERIALS[category].map((m) => (
                <option key={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* STOCK INPUT */}
        {material && (
          <div style={cardStyle}>
            <input
              type="number"
              placeholder={`Add Stock (${unit})`}
              value={stock.add}
              onChange={(e) =>
                setStock({ ...stock, add: e.target.value })
              }
            />

            <input
              type="number"
              placeholder={`Used Stock (${unit})`}
              value={stock.used}
              onChange={(e) =>
                setStock({ ...stock, used: e.target.value })
              }
            />
          </div>
        )}

        <button style={btnStyle}>Save Stock</button>
      </form>

      <button style={viewBtn} onClick={handleViewStock}>
        {showTable ? "Hide Stock" : "View My Site Stock"}
      </button>

      {/* TABLE */}
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
                <td>{new Date(s.date).toLocaleDateString()}</td>
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



// ================= STYLES =================

const containerStyle = {
  maxWidth: 1200,
  margin: "80px auto",
  padding: 20,
  background: "#333",
  color: "#fff",
  borderRadius: 8,
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
};
