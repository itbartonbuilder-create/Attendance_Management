import React, { useEffect, useState } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";


function AdminMeasurements() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const site = params.get("site");
  const [data, setData] = useState([]);
  const [totalQty, setTotalQty] = useState(0);
  const fetchMeasurements = async () => {
    if (!site) return;
    const res = await API.get(`/measurement/site/${site}`);
    setData(res.data);

    let total = 0;
    res.data.forEach(item => total += Number(item.quantity));
    setTotalQty(total.toFixed(3));
  };

  useEffect(() => {
    fetchMeasurements();
  }, [site]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1>📊 Site Measurement Report</h1>
        {/* <h2>🏗 Site : {site}</h2> */}
        <div style={styles.totalBox}>
          Total Quantity : <span>{totalQty} m³</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Work</th>
              <th style={styles.th}>Length</th>
              <th style={styles.th}>Breadth</th>
              <th style={styles.th}>Height</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {data.map((m,i)=>(
              <tr key={i}>
                <td style={styles.td}>{new Date(m.date).toLocaleDateString()}</td>
                <td style={styles.td}>{m.workType}</td>
                <td style={styles.td}>{m.length}</td>
                <td style={styles.td}>{m.breadth}</td>
                <td style={styles.td}>{m.height}</td>
                <td style={styles.td}>{m.quantity} m³</td>
                <td style={styles.td}>{m.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const styles = {
  page:{
    padding:"80px 20px",
    background:"#121212",
    minHeight:"100vh",
    color:"white"
  },

  card:{
    background:"#1f1f1f",
    padding:"30px",
    borderRadius:"10px"
  },

  totalBox:{
    background:"#2c2c2c",
    padding:"15px",
    borderRadius:"8px",
    margin:"20px 0",
    fontSize:"20px"
  },

  table:{
    width:"100%",
    borderCollapse:"collapse"
  },

  th:{
    padding:"12px",
    background:"#2c3e50",
    textAlign:"left"
  },

  td:{
    padding:"12px",
    borderBottom:"1px solid #444"
  }
};
export default AdminMeasurements;
