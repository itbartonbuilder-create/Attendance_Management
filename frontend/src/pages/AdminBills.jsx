import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const AdminBills = () => {

  const user = JSON.parse(localStorage.getItem("user"));

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedSite = queryParams.get("siteId");

  if (!user || user.role !== "admin") {
    return <h2 style={{ color: "white", padding: 40 }}>Access Denied</h2>;
  }

  // ================= FETCH BILLS =================

  const fetchBills = async () => {
    try {

      setLoading(true);

      const res = await axios.get(
        "https://attendance-management-backend-vh2w.onrender.com/api/bill",
        {
          params: {
            role: "admin",
            site: selectedSite,
          },
        }
      );

      setBills(res.data || []);

    } catch (err) {
      console.error(err);
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSite) {
      fetchBills();
    }
  }, [selectedSite]);

  // ================= CHANGE STATUS =================
const downloadBill = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "bill-file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.error("Download failed", err);
  }
};
  const changeStatus = async (billId, status) => {

    const confirmMsg =
      status === "approved"
        ? "Approve this bill?"
        : "Reject this bill?";

    if (!window.confirm(confirmMsg)) return;

    try {

      await axios.put(
        `https://attendance-management-backend-vh2w.onrender.com/api/bill/${billId}/status`,
        { status }
      );

      setBills((prev) =>
        prev.map((b) =>
          b._id === billId ? { ...b, status } : b
        )
      );

    } catch (err) {
      console.error(err);
      alert("Failed to update bill status");
    }
  };

  return (

    <div style={page}>

      <h2 style={{ marginBottom: 20 }}>
        All Vendor / Manager Bills (Admin)
      </h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && bills.length === 0 && (
        <p>No bills found</p>
      )}

      {!loading && bills.length > 0 && (

        <table style={table}>

          <thead>

            <tr style={tableHead}>
              <th style={th}>Vendor</th>
              <th style={th}>Company</th>
              <th style={th}>Work</th>
              <th style={th}>Bill No</th>
              <th style={th}>Site</th>
              <th style={th}>Amount</th>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              <th style={th}>Bill</th>
              <th style={th}>Action</th>
            </tr>

          </thead>

          <tbody>

            {bills.map((b) => {

              const status = b.status || "pending";

              return (

                <tr key={b._id} style={row}>

                  <td style={td}>
                    {b.vendor?.name || "Manager"}
                  </td>

                  <td style={td}>
                    {b.vendor?.companyName || "-"}
                  </td>

                  <td style={td}>{b.workName}</td>

                  <td style={td}>{b.billNo}</td>

                  <td style={td}>{b.site}</td>

                  <td style={td}>₹{b.amount}</td>

                  <td style={td}>
                    {new Date(b.billDate).toLocaleDateString()}
                  </td>

                  <td
                    style={{
                      ...td,
                      fontWeight: 600,
                      color:
                        status === "approved"
                          ? "lightgreen"
                          : status === "rejected"
                          ? "salmon"
                          : "orange",
                    }}
                  >
                    {status}
                  </td>

                 <td style={td}>
  {b.billFile ? (
    <>
      <a
        href={b.billFile}
        target="_blank"
        rel="noreferrer"
        style={viewBtn}
      >
        View
      </a>

     <button
  style={downloadBtn}
  onClick={() => downloadBill(b.billFile)}
>
  Download
</button>
    </>
  ) : (
    "-"
  )}
</td>

                  <td style={td}>

                    {status === "pending" ? (

                      <>
                        <button
                          style={approveBtn}
                          onClick={() =>
                            changeStatus(b._id, "approved")
                          }
                        >
                          Approve
                        </button>

                        <button
                          style={rejectBtn}
                          onClick={() =>
                            changeStatus(b._id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </>

                    ) : (
                      "-"
                    )}

                  </td>

                </tr>

              );
            })}

          </tbody>

        </table>

      )}

    </div>

  );
};

/* ================= CSS ================= */

const page = {
  padding: "100px 30px",
  background: "#121212",
  minHeight: "100vh",
  color: "white"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 20
};

const tableHead = {
  background: "#2c3e50"
};

const th = {
  padding: "12px",
  textAlign: "left"
};

const td = {
  padding: "12px"
};

const row = {
  borderBottom: "1px solid #444"
};

const approveBtn = {
  background: "green",
  color: "white",
  border: "none",
  padding: "6px 10px",
  marginRight: "6px",
  borderRadius: "4px",
  cursor: "pointer"
};

const rejectBtn = {
  background: "crimson",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer"
};
const viewBtn = {
  background: "#3498db",
  color: "white",
  padding: "6px 10px",
  borderRadius: "4px",
  marginRight: "6px",
  textDecoration: "none"
};

const downloadBtn = {
  background: "#2ecc71",
  color: "white",
  padding: "6px 10px",
  borderRadius: "4px",
  textDecoration: "none"
};
export default AdminBills;
