import React, { useState } from "react";
import { useLocation } from "react-router-dom";

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
    // Sand ke multiple units allowed hain: CFT, Sq Ft, Ton, Quintal
    { name: "Sand", unit: ["CFT", "Sq Ft", "Ton", "Quintal"] }, 
    { name: "Bricks", unit: "Nos" },
  ],
  Aggregate: [
    { name: "Aggregate 10mm", unit: "CFT" },
    { name: "Aggregate 20mm", unit: "CFT" },
    { name: "Aggregate 40mm", unit: "CFT" },
  ],
  Shuttering: [
    { name: "Plates", unit: "Nos" },
    { name: "Props", unit: "Nos" },
    { name: "Pipes", unit: "Nos" },
  ],
  Wire: [
    { name: "Copper Wire 0.75mm", unit: "m" },
    { name: "Copper Wire 1mm", unit: "m" },
    { name: "Copper Wire 1.5mm", unit: "m" },
    { name: "Copper Wire 2.5mm", unit: "m" },
    { name: "Copper Wire 4mm", unit: "m" },
    { name: "Copper Wire 6mm", unit: "m" },
    { name: "Copper Wire 8mm", unit: "m" },
    { name: "Copper Wire 10mm", unit: "m" },

    { name: "Aluminium Wire 0.75mm", unit: "m" },
    { name: "Aluminium Wire 1mm", unit: "m" },
    { name: "Aluminium Wire 1.5mm", unit: "m" },
    { name: "Aluminium Wire 2.5mm", unit: "m" },
    { name: "Aluminium Wire 4mm", unit: "m" },
    { name: "Aluminium Wire 6mm", unit: "m" },
    { name: "Aluminium Wire 8mm", unit: "m" },
    { name: "Aluminium Wire 10mm", unit: "m" },
  ],
  Switch: [
    { name: "Switch 6A", unit: "Ampere" },
    { name: "Switch 10A", unit: "Ampere" },
    { name: "Switch 16A", unit: "Ampere" },
    { name: "Switch 20A", unit: "Ampere" },
    { name: "Switch 32A", unit: "Ampere" },
    { name: "Switch 64A", unit: "Ampere" },
  ],
  MCB: [
    { name: "MCB 6A", unit: "Ampere" },
    { name: "MCB 16A", unit: "Ampere" },
    { name: "MCB 32A", unit: "Ampere" },
  ],
  Socket: [
    { name: "Socket 6A", unit: "Ampere" },
    { name: "Socket 10A", unit: "Ampere" },
    { name: "Socket 16A", unit: "Ampere" },
    { name: "Socket 20A", unit: "Ampere" },
    { name: "Socket 32A", unit: "Ampere" },
    { name: "Socket 64A", unit: "Ampere" },
  ],
  Plumbing: [
    { name: "Pipe", unit: "Feet" },
    { name: "Elbow", unit: "Nos" },
    { name: "Tap", unit: "Nos" },
    { name: "Other", unit: "" }, // Added "Other" option
  ],
};

function StockManagement() {
  const user = JSON.parse(localStorage.getItem("user"));
  const managerSite = user?.site || "";

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedDate =
    queryParams.get("date") || new Date().toLocaleDateString("en-CA");

  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [customMaterial, setCustomMaterial] = useState(""); 
  const [unit, setUnit] = useState("");
  const [availableUnits, setAvailableUnits] = useState([]); 

  const [availableStock, setAvailableStock] = useState(0);

  const [stock, setStock] = useState({
    add: "",
    used: "",
  });

  const [stocks, setStocks] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);

  const realRemaining =
    availableStock + Number(stock.add || 0) - Number(stock.used || 0);

  const remaining = Math.max(0, realRemaining);

  const fetchStocks = async () => {
    const res = await fetch(
      `https://attendance-management-backend-vh2w.onrender.com/api/stocks?site=${managerSite}`
    );

    const data = await res.json();
    const allStocks = data.data || [];
    setStocks(allStocks);

    const finalMaterialName = material === "Other" ? customMaterial : material;

    if (finalMaterialName) {
      const materialStocks = allStocks.filter(
        (s) => s.material === finalMaterialName
      );

      if (materialStocks.length > 0) {
        setAvailableStock(materialStocks[0].remainingStock);
      } else {
        setAvailableStock(0);
      }
    }
  };

  const handleMaterialChange = async (value) => {
    const selected = MATERIALS[category]?.find((m) => m.name === value);

    setMaterial(value);
    setCustomMaterial("");


    if (Array.isArray(selected?.unit)) {
      setAvailableUnits(selected.unit);
      setUnit(selected.unit[0]); 
    } else {
      setAvailableUnits([]);
      setUnit(selected?.unit || "");
    }

    const res = await fetch(
      `https://attendance-management-backend-vh2w.onrender.com/api/stocks?site=${managerSite}`
    );

    const data = await res.json();
    const allStocks = data.data || [];

    const materialStocks = allStocks.filter((s) => s.material === value);

    if (materialStocks.length > 0) {
      setAvailableStock(materialStocks[0].remainingStock);
    } else {
      setAvailableStock(0);
    }
    setStock({ add: "", used: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalMaterialName = material === "Other" ? customMaterial : material;

    if (!finalMaterialName) {
      alert("Please enter a valid material name");
      return;
    }

    if (realRemaining < 0) {
      alert("Used stock cannot exceed available stock");
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
            material: finalMaterialName,
            unit,
            addStock: Number(stock.add || 0),
            usedStock: Number(stock.used || 0),
            date: selectedDate,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Stock Saved Successfully");

      fetchStocks();

      setCategory("");
      setMaterial("");
      setCustomMaterial("");
      setUnit("");
      setAvailableUnits([]);
      setAvailableStock(0);
      setStock({ add: "", used: "" });
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
              setCustomMaterial("");
              setUnit("");
              setAvailableUnits([]);
              setAvailableStock(0);
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

        {/* Dynamic input for Plumbing -> Other */}
        {material === "Other" && (
          <div style={sectionStyle}>
            <label>Specify Other Material Name</label>
            <input
              type="text"
              placeholder="e.g. Connector, Solvent, Tank..."
              value={customMaterial}
              onChange={(e) => setCustomMaterial(e.target.value)}
              style={input}
              required
            />
          </div>
        )}

        {material && (
          <div style={cardStyle}>
            {/* Unit Dropdown if Sand (or multiple units array), otherwise input/text */}
            {availableUnits.length > 0 ? (
              <div style={{ marginBottom: 10 }}>
                <label style={{ marginRight: 10 }}>Select Unit:</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: "4px" }}
                >
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            ) : material === "Other" ? (
              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="Unit (e.g. Nos, Meter, Kg)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={input}
                  required
                />
              </div>
            ) : null}

            <p>
              Available: <b>{availableStock}</b> {unit}
            </p>

            <input
              type="number"
              placeholder={`Add Stock (${unit})`}
              value={stock.add}
              onChange={(e) => setStock({ ...stock, add: e.target.value })}
            />

            <input
              type="number"
              placeholder={`Used (${unit})`}
              value={stock.used}
              onChange={(e) => setStock({ ...stock, used: e.target.value })}
            />

            <p>
              Remaining:{" "}
              <b style={{ color: "#2ecc71" }}>{remaining}</b> {unit}
            </p>
          </div>
        )}

        <button style={btnStyle} disabled={loading || !material}>
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
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s._id}>
                <td>
                  {s.date
                    ? new Date(s.date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{s.site}</td>
                <td>{s.category}</td>
                <td>{s.material}</td>
                <td>{s.totalStock}</td>
                <td>{s.usedStock}</td>
                <td>{s.remainingStock}</td>
                <td>{s.unit || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StockManagement;

const containerStyle = {
  maxWidth: 1200,
  margin: "105px auto",
  padding: 20,
  background: "#333",
  color: "#fff",
  borderRadius: 8,
};

const input = {
  padding: "12px 15px",
  margin: "10px 0",
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
