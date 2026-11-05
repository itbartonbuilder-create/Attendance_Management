import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import companyLogo from "../assets/logo.png";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";


const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB");
};

const safeFilename = (value) =>
  String(value || "Site").replace(/[^a-zA-Z0-9_-]/g, "_");
const number = (value) => {
  if (value === "" || value == null) return "-";
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN", {
    maximumFractionDigits: 3,
  }) : String(value);
};
const amountFor = (item) =>
  Number(item.amount ?? (
    Number(item.quantity || 0) * Number(item.rate || 0)
  ));
function AdminMeasurements() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const site = params.get("site") || "";

  const [measurementType, setMeasurementType] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");
  const [downloading, setDownloading] = useState("");

  const fetchMeasurements = useCallback(async () => {
    if (!site || !measurementType) {
      setData([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await API.get(
        `/measurement?site=${encodeURIComponent(site)}` +
        `&measurementType=${encodeURIComponent(measurementType)}`
      );
      const records = Array.isArray(res.data) ? res.data : [];
      const filtered = records.filter(
        (item) =>
          String(item.site || "").trim().toLowerCase() ===
          String(site).trim().toLowerCase()
      );

      filtered.sort((a, b) => {
        const noA = Number(a.measurementNo);
        const noB = Number(b.measurementNo);

        if (
          a.measurementNo != null &&
          b.measurementNo != null &&
          Number.isFinite(noA) &&
          Number.isFinite(noB)
        ) {
          return noA - noB;
        }

        return (
          new Date(a.date || a.createdAt || 0) -
          new Date(b.date || b.createdAt || 0)
        );
      });

      setData(filtered);
    } catch (err) {
      console.error("Admin measurement fetch error:", err);
      setError(
        err?.response?.data?.message ||
        "Measurements load nahi ho paayi. Please refresh karein."
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [site, measurementType]);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const groups = useMemo(() => {
    const grouped = new Map();

    data.forEach((item) => {
      const key = item.batchId
        ? `batch_${item.batchId}`
        : `single_${item._id}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          batchId: item.batchId || null,
          site: item.site || site,
          date: item.date,
          items: [],
        });
      }

      grouped.get(key).items.push(item);
    });

    return Array.from(grouped.values()).sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    );
  }, [data, site]);

  const totals = useMemo(() => {
    const quantityByUnit = {};
    let amount = 0;

    data.forEach((item) => {
      const unit = item.unit || "No Unit";

      quantityByUnit[unit] =
        (quantityByUnit[unit] || 0) +
        (Number(item.quantity) || 0);

      if (measurementType === "fixed") {
        amount += amountFor(item);
      }
    });

    return { quantityByUnit, amount };
  }, [data, measurementType]);

  const deleteRecords = async (items, groupKey) => {
    if (!items?.length) return;

    const message =
      items.length === 1
        ? "Kya aap is measurement ko permanently delete karna chahte hain?"
        : `Kya aap is batch ki sabhi ${items.length} measurements delete karna chahte hain?`;

    if (!window.confirm(message)) return;

    setDeleting(groupKey);

    try {
      await Promise.all(
        items.map((item) => {
          if (!item._id) {
            throw new Error("Measurement ID missing hai.");
          }
          return API.delete(
            `/measurement/${encodeURIComponent(item._id)}`
          );
        })
      );

      await fetchMeasurements();
      window.alert("Measurement successfully delete ho gayi.");
    } catch (err) {
      console.error("Admin delete error:", err);
      window.alert(
        err?.response?.data?.message ||
        "Delete nahi ho paaya. Please refresh karke check karein."
      );

      await fetchMeasurements();
    } finally {
      setDeleting("");
    }
  };

  const downloadPDF = async (items, groupKey) => {
    if (!items?.length) return;

    setDownloading(groupKey);

    try {
      const fixed = measurementType === "fixed";
      const first = items[0];
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      if (companyLogo) {
        try {
          doc.addImage(companyLogo, "PNG", 12, 9, 15, 15);
        } catch (logoError) {
          console.warn("Logo could not be added:", logoError);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("BARTONS BUILDERS LIMITED", 31, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        fixed
          ? "FIXED MEASUREMENT REPORT"
          : "CALCULATING MEASUREMENT REPORT",
        31,
        23
      );

      doc.setFontSize(9);
      doc.text(`Site: ${first.site || site}`, 12, 32);
      doc.text(`Date: ${formatDate(first.date)}`, 12, 38);
      doc.text(`Records: ${items.length}`, pageWidth - 12, 32, {
        align: "right",
      });

      const columns = fixed
        ? [
            "Measurement No.",
            "Date",
            "Work Type",
            "Description",
            "Quantity",
            "Unit",
            "Rate",
            "Amount",
            "Remarks",
          ]
        : [
            "Measurement No.",
            "Date",
            "Work Type",
            "Description",
            "Length",
            "Breadth",
            "Height",
            "Unit Weight",
            "Quantity",
            "Unit",
            "Remarks",
          ];

      const rows = items.map((item, index) => {
        if (fixed) {
          return [
            item.measurementNo ?? index + 1,
            formatDate(item.date),
            item.workType || "-",
            item.description || "-",
            number(item.quantity),
            item.unit || "-",
            `Rs. ${Number(item.rate || 0).toFixed(2)}`,
            `Rs. ${amountFor(item).toFixed(2)}`,
            item.remarks || "-",
          ];
        }

        return [
          item.measurementNo ?? index + 1,
          formatDate(item.date),
          item.workType || "-",
          item.description || "-",
          number(item.length),
          number(item.breadth),
          number(item.height),
          number(item.unitWeight),
          number(item.quantity),
          item.unit || "-",
          item.remarks || "-",
        ];
      });

      const totalAmount = items.reduce(
        (sum, item) => sum + amountFor(item),
        0
      );

      autoTable(doc, {
        startY: 44,
        head: [columns],
        body: rows,
        ...(fixed
          ? {
              foot: [[
                "",
                "",
                "",
                "",
                "",
                "",
                "Grand Total",
                `Rs. ${totalAmount.toFixed(2)}`,
                "",
              ]],
              showFoot: "lastPage",
            }
          : {}),
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: fixed ? 8 : 7,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        margin: { left: 10, right: 10, bottom: 14 },
        didDrawPage: () => {
          const height = doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            pageWidth - 12,
            height - 6,
            { align: "right" }
          );
        },
      });

      const safeSite = safeFilename(first.site || site);
      const safeGroup = safeFilename(first.batchId || first._id);
      const fileName =
        `${fixed ? "Fixed" : "Calculating"}_Measurement_` +
        `${safeSite}_.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc
          .output("datauristring")
          .split(",")[1];

        const saved = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title: "Measurement PDF",
          text: `${first.site || site} - ${
            fixed ? "Fixed" : "Calculating"
          } Measurement`,
          files: [saved.uri],
          dialogTitle: "Download / Share Measurement PDF",
        });
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      console.error("Measurement PDF error:", err);
      window.alert(
        err?.message || "PDF download nahi ho paaya."
      );
    } finally {
      setDownloading("");
    }
  };

  const resetSelection = () => {
    setMeasurementType("");
    setData([]);
    setError("");
  };

  const dimensions = (item) => {
    const parts = [];
    if (item.length != null && item.length !== "") parts.push(`L: ${item.length}`);
    if (item.breadth != null && item.breadth !== "" && Number(item.breadth) !== 0) {
      parts.push(`B: ${item.breadth}`);
    }
    if (item.height != null && item.height !== "" && Number(item.height) !== 0) {
      parts.push(`H: ${item.height}`);
    }
    return parts.length ? parts.join(", ") : "-";
  };

  const cellItems = (items, render, keyPrefix) =>
    items.map((item, index) => (
      <div key={item._id || `${keyPrefix}_${index}`} style={styles.cellItem}>
        {render(item, index)}
      </div>
    ));

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Measurement Report</h2>
          </div>
        </div>

        {!site && (
          <div style={styles.warning}>
            Site select nahi hai. Please site ke saath AdminMeasurements page open karein, jaise ?site=Office.
          </div>
        )}

        <div style={styles.typeSelector}>
          <label htmlFor="measurementType" style={styles.typeLabel}>
            Select Measurement Type
          </label>
          <select
            id="measurementType"
            value={measurementType}
            disabled={!site}
            onChange={(e) => {
              setMeasurementType(e.target.value);
              setData([]);
              setError("");
            }}
            style={styles.typeDropdown}
          >
            <option value="">-- Select --</option>
            <option value="fixed">Fixed Measurement</option>
            <option value="calculating">Calculating Measurement</option>
          </select>
        </div>

        {measurementType && (
          <>
            <div style={styles.toolbar}>
              <h3 style={{ margin: 0 }}>
                {measurementType === "fixed" ? "Fixed Measurement History" : "Calculating Measurement History"}
              </h3>
              <button
                type="button"
                style={{ ...styles.button, background: "#2563eb" }}
                onClick={fetchMeasurements}
                disabled={loading}
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {loading && <p style={styles.muted}>Measurements load ho rahi hain...</p>}
            {!loading && !error && data.length === 0 && (
              <div style={styles.empty}>No Records</div>
            )}

            {data.length > 0 && (
              <>
                {measurementType === "fixed" && (
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                      <span>Grand Total Amount</span>
                      <strong>₹{totals.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={styles.unitSummary}>
                      <strong>Quantity totals by unit:</strong>
                      {Object.entries(totals.quantityByUnit).map(([unit, quantity]) => (
                        <span key={unit} style={styles.unitChip}>{unit}: {number(quantity)}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "7%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "15%" }} />
                      {measurementType === "fixed" ? (
                        <>
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "6%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "8%" }} />
                        </>
                      ) : (
                        <>
                          <col style={{ width: "17%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "6%" }} />
                          <col style={{ width: "8%" }} />
                        </>
                      )}
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "13%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        {[
                          "Date",
                          "Serial No.",
                          "Work",
                          "Description",
                          ...(measurementType === "fixed"
                            ? ["Qty", "Unit", "Rate", "Amount"]
                            : ["Dimensions (L, B, H)", "Qty", "Unit", "Unit Weight"]),
                          "Remarks",
                          "Action",
                        ].map((heading) => (
                          <th key={heading} style={styles.th}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => {
                        const items = group.items;
                        const firstItem = items[0];
                        return (
                          <tr key={group.key}>
                            <td style={{ ...styles.td, ...styles.wrapCell }}>
                              {formatDate(group.date || firstItem?.date)}
                            </td>
                            <td style={{ ...styles.td, ...styles.wrapCell }}>
                              {cellItems(items, (item, index) => item.measurementNo ?? index + 1, `${group.key}_no`)}
                            </td>
                            <td style={{ ...styles.td, ...styles.wrapCell }}>
                              {cellItems(items, (item) => item.workType || "-", `${group.key}_work`)}
                            </td>
                            <td style={{ ...styles.td, ...styles.wrapCell }}>
                              {cellItems(items, (item) => item.description || "-", `${group.key}_desc`)}
                            </td>

                            {measurementType === "fixed" ? (
                              <>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => number(item.quantity), `${group.key}_qty`)}
                                </td>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => item.unit || "-", `${group.key}_unit`)}
                                </td>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => `₹${Number(item.rate || 0).toFixed(2)}`, `${group.key}_rate`)}
                                </td>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => `₹${amountFor(item).toFixed(2)}`, `${group.key}_amount`)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => dimensions(item), `${group.key}_dims`)}
                                </td>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => number(item.quantity), `${group.key}_qty`)}
                                </td>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => item.unit || "-", `${group.key}_unit`)}
                                </td>
                                <td style={{ ...styles.td, ...styles.wrapCell }}>
                                  {cellItems(items, (item) => number(item.unitWeight), `${group.key}_weight`)}
                                </td>
                              </>
                            )}

                            <td style={{ ...styles.td, ...styles.wrapCell }}>
                              {cellItems(items, (item) => item.remarks || "-", `${group.key}_remarks`)}
                            </td>
                            <td style={{ ...styles.td, ...styles.wrapCell }}>
                              <div style={styles.actionStack}>
                                <button
                                  type="button"
                                  style={{ ...styles.button, background: "#059669", width: "100%" }}
                                  disabled={downloading === group.key}
                                  onClick={() => downloadPDF(items, group.key)}
                                >
                                  {downloading === group.key ? "Preparing PDF..." : "⬇ Download PDF"}
                                </button>
                                <button
                                  type="button"
                                  style={{ ...styles.button, background: "#dc2626", width: "100%" }}
                                  disabled={deleting === group.key}
                                  onClick={() => deleteRecords(items, group.key)}
                                >
                                  {deleting === group.key ? "Deleting..." : "🗑 Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "80px 20px 30px",
    background: "#121212",
    minHeight: "100vh",
    color: "#f8fafc",
    boxSizing: "border-box",
  },
  card: {
    background: "#1f1f1f",
    padding: "24px",
    borderRadius: "12px",
    maxWidth: "1800px",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    borderBottom: "1px solid #444",
    paddingBottom: "15px",
  },
  title: { margin: "0 0 8px", fontSize: "25px" },
  muted: { color: "#aab4c3", fontSize: "13px" },
  typeSelector: {
    marginTop: "22px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    maxWidth: "400px",
  },
  typeLabel: { color: "#f8fafc", fontSize: "14px", fontWeight: "600" },
  typeDropdown: {
    width: "100%",
    padding: "12px",
    background: "#292929",
    color: "#ffffff",
    border: "1px solid #64748b",
    borderRadius: "7px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 13px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px",
    marginBottom: "15px",
  },
  summaryGrid: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "12px",
    marginTop: "18px",
    marginBottom: "18px",
  },
  summaryCard: {
    background: "#292929",
    border: "1px solid #414141",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    color: "#cbd5e1",
    fontSize: "13px",
  },
  unitSummary: { 
    display: "flex",
     flexWrap: "wrap", 
     alignItems: "center", 
     gap: "9px" 
  },
  unitChip: { 
    background: "#303b49", 
    borderRadius: "5px", 
    padding: "6px 9px", 
    fontSize: "12px" 
  },
  tableWrapper: { 
    width: "100%", 
    overflowX: "auto", 
    borderRadius: "6px", 
    marginTop: "18px" 
  },
  table: { 
    width: "100%", 
    minWidth: "1200px", 
    tableLayout: "fixed", 
    borderCollapse: "collapse", 
    fontSize: "12px" 
  },
  th: {
    padding: "11px 9px",
    background: "#2c3e50",
    border: "1px solid #465a6d",
    textAlign: "left",
    verticalAlign: "middle",
    whiteSpace: "normal",
  },
  td: { 
    padding: "0", 
    border: "1px solid #444", 
    verticalAlign: "top" 
  },
  wrapCell: { 
    overflowWrap: "anywhere", 
    wordBreak: "break-word" 
  },
  cellItem: {
    padding: "10px 8px",
    minHeight: "18px",
    borderBottom: "1px solid #3f3f3f",
    lineHeight: 1.45,
    overflowWrap: "anywhere",
  },
  actionStack: { 
    padding: "8px", 
    display: "flex", 
    flexDirection: "column", 
    gap: "7px", 
    minWidth: "120px" 
  },
  warning: { 
    marginTop: "20px", 
    padding: "14px", 
    background: "#713f12", 
    borderRadius: "7px", 
    color: "#fef3c7" 
  },
  error: { 
    marginTop: "18px", 
    padding: "14px", 
    background: "#7f1d1d", 
    borderRadius: "7px" 
  },
  empty: { 
    marginTop: "20px", 
    padding: "25px", 
    background: "#292929", 
    borderRadius: "8px", 
    textAlign: "center", 
    color: "#cbd5e1" 
  },
};

export default AdminMeasurements;
