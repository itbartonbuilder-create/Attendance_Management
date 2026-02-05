import React, { useEffect, useState } from "react";

function AdminStockPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const managerSite = user?.site;

  const [stocks, setStocks] = useState([]);
  const [site, setSite] = useState(role === "manager" ? managerSite : "");
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      let url = "https://attendance-management-backend-vh2w.onrender.com/api/stocks";

     
      if (role === "manager") {
        url += `?site=${managerSite}`;
      }

      if (role === "admin" && site) {
        url += `?site=${site}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      const stockData = data.data || [];
      setStocks(stockData);

      
      if (role === "admin") {
        const uniqueSites = [...new Set(stockData.map((s) => s.site))];
        setSites(uniqueSites);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [site]);

  return (
    <div style={containerStyle}>
      <h2>
        📦 Stock Management{" "}
        {role === "manager" && `(${managerSite})`}
      </h2>

      {role === "admin" && (
        <div style={filterBar}>
          <select value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button onClick={fetchStocks} style={btnStyle}>
            Refresh
          </button>
        </div>
      )}

    
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
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
            {stocks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No stock found
                </td>
              </tr>
            ) : (
              stocks.map((s) => (
                <tr key={s._id}>
                  <td>{s.site}</td>
                  <td>{s.category}</td>
                  <td>{s.material}</td>
                  <td>{s.totalStock}</td>
                  <td>{s.usedStock}</td>
                  <td
                    style={{
                      color:
                        s.remainingStock < 10 ? "red" : "lightgreen",
                      fontWeight: "bold",
                    }}
                  >
                    {s.remainingStock}
                  </td>
                  <td>{s.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminStockPage;



const containerStyle = {
  maxWidth: 1200,
  margin: "100px auto",
  padding: 20,
  background: "#2c3e50",
  color: "#fff",
  borderRadius: 8,
};

const filterBar = {
  display: "flex",
  gap: 12,
  marginBottom: 20,
};

const btnStyle = {
  padding: "8px 16px",
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};
