import React, { useState, useEffect } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";

function Measurement() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const site = params.get("site");
  const dateParam = params.get("date");

  
  const [workType, setWorkType] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [height, setHeight] = useState("");
  const [qty, setQty] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [measurements, setMeasurements] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const l = parseFloat(length) || 0;
    const b = parseFloat(breadth) || 0;
    const h = parseFloat(height) || 0;
    setQty((l * b * h).toFixed(3));
  }, [length, breadth, height]);

  const fetchMeasurements = async () => {
    if (!site) return;
    const res = await API.get(`/measurement?site=${site}`);
    setMeasurements(res.data);
  };

  useEffect(() => {
    fetchMeasurements();
  }, [site]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      site,
      date: dateParam,
      workType,
      length,
      breadth,
      height,
      quantity: qty,
      remarks,
    };

    await API.post("/measurement", data);
    alert("✅ Measurement Saved");

    fetchMeasurements();
    setWorkType(""); setLength(""); setBreadth(""); setHeight(""); setRemarks("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2> Site Measurement</h2>
        {/* <p>🏗 Site: <b>{site}</b></p> */}
        {/* <p>📅 Date: <b>{dateParam}</b></p> */}

        <form onSubmit={handleSubmit} style={styles.form}>
          <select style={styles.input} value={workType} onChange={e=>setWorkType(e.target.value)} required>
            <option value="">Work Type</option>
            <option>Excavation</option>
            <option>PCC</option>
            <option>RCC</option>
            <option>Brick Work</option>
            <option>Plaster</option>
            <option>Flooring</option>
          </select>

          <div style={styles.grid3}>
            <input style={styles.input} placeholder="Length" value={length} onChange={e=>setLength(e.target.value)} />
            <input style={styles.input} placeholder="Breadth" value={breadth} onChange={e=>setBreadth(e.target.value)} />
            <input style={styles.input} placeholder="Height" value={height} onChange={e=>setHeight(e.target.value)} />
          </div>

          <div style={styles.qty}>
            Quantity: <b style={{color:"#38bdf8"}}>{qty} m³</b>
          </div>

          <textarea style={styles.textarea} placeholder="Remarks" value={remarks} onChange={e=>setRemarks(e.target.value)} />

          <button style={styles.btn}>Save Measurement</button>
        </form>

        <button style={styles.toggle} onClick={()=>setShowHistory(!showHistory)}>
          {showHistory ? "Hide History ▲" : "View History ▼"}
        </button>

        {showHistory && (
          <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Work</th>
                    <th style={styles.th}>Length</th>
                    <th style={styles.th}>Breadth</th>
                    <th style={styles.th}>Height</th>
                    <th style={styles.th}>Qty (m³)</th>
                    <th style={styles.th}>Remarks</th>
                </tr>
            </thead>
            <tbody>
                {measurements.map((m,i)=>(
                    <tr key={i}>
                    <td style={styles.td}>{new Date(m.date).toLocaleDateString()}</td>
                    <td style={styles.td}>{m.workType}</td>
                    <td style={styles.td}>{m.length}</td>
                    <td style={styles.td}>{m.breadth}</td>
                    <td style={styles.td}>{m.height}</td>
                    <td style={styles.td}>{m.quantity}</td>
                    <td style={styles.td}>{m.remarks}</td>
                    </tr>
                ))}
                </tbody>
          </table>
        )}
      </div>
    </div>
    
  );
}
const styles = {
  page: { 
    padding: "100px 20px",
    background: "#121212",
    minHeight: "100vh",
    color: "white"
  },

  card: { 
    background: "#1f1f1f",
    padding: "25px 50px",
    borderRadius: "10px",
    marginBottom: "40px",
    width: "1200px"
  },

  form: {
    marginTop: "20px"
  },

  grid3: {
    display: "flex",
    gap: "10px",
    // marginBottom: "15px",
    flexWrap: "wrap"
  },

  input: { 
    flex: "1 1 200px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#2c2c2c",
    color: "white",
    minWidth: "140px",
    marginBottom: "15px"
  },

  textarea: { 
    width: "98%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#2c2c2c",
    color: "white",
    marginBottom: "15px"
  },

  qty: { 
    background: "#2c2c2c",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "18px"
  },

  btn: { 
    background: "#1e88e5",
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontSize: "16px"
  },

  toggle: { 
    background: "#1e88e5",
    border: "none",
    padding: "10px 16px",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "20px"
  },

  table: { 
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px"
  },

  th: { 
    padding: "12px",
    textAlign: "left",
    background: "#2c3e50"
  },

  td: { 
    padding: "12px",
    borderBottom: "1px solid #444"
  }
};
export default Measurement;
