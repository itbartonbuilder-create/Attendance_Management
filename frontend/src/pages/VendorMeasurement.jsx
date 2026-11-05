import React, { useCallback, useEffect, useState } from "react";
import API from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import companyLogo from "../assets/logo.png";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const getStoredObject = (...keys) => {
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
    }
  }

  return null;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB");
};

const formatNumber = (value) => {
  if (value === "" || value == null) return "-";

  const n = Number(value);

  return Number.isFinite(n)
    ? n.toLocaleString("en-IN", { maximumFractionDigits: 3 })
    : String(value);
};

const money = (value) => {
  if (value === "" || value == null || !Number.isFinite(Number(value))) {
    return "-";
  }

  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getMeasurements = (order) => {
  const list = Array.isArray(order.measurementIds)
    ? order.measurementIds
    : Array.isArray(order.measurements)
      ? order.measurements
      : [];

  return list.filter(
    (item) => item && typeof item === "object" && (item._id || item.workType)
  );
};

const getApprovalForMeasurement = (order, item) => {
  const approvals = Array.isArray(order?.rateApprovals) ? order.rateApprovals : [];
  const measurementId = getId(item?._id || item?.id);

  return approvals.find(
    (approval) => getId(approval?.measurementId) === measurementId
  );
};

const getMeasurementRate = (order, item) => {
  const approval = getApprovalForMeasurement(order, item);
  const rawRate =
    approval?.rate != null && approval.rate !== ""
      ? approval.rate
      : item?.rate;

  if (rawRate == null || rawRate === "") return null;
  const rate = Number(rawRate);
  return Number.isFinite(rate) ? rate : null;
};

const getMeasurementAmount = (order, item) => {
  const approval = getApprovalForMeasurement(order, item);

  if (approval?.amount != null && approval.amount !== "") {
    const amount = Number(approval.amount);
    if (Number.isFinite(amount)) return amount;
  }

  if (item?.amount != null && item.amount !== "") {
    const amount = Number(item.amount);
    if (Number.isFinite(amount)) return amount;
  }

  const quantity = Number(item?.quantity);
  const rate = getMeasurementRate(order, item);

  if (
    item?.quantity != null &&
    item.quantity !== "" &&
    Number.isFinite(quantity) &&
    rate != null
  ) {
    return quantity * rate;
  }

  return null;
};

const safeFilename = (value) =>
  String(value || "Work_Order").replace(/[^a-zA-Z0-9_-]/g, "_");

const getVendorFromStorage = () =>
  getStoredObject("vendor", "loggedInVendor", "vendorData", "user");

function VendorWorkOrders() {
  const [vendor, setVendor] = useState(getVendorFromStorage);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");
  const [expanded, setExpanded] = useState({});

  const vendorId = getId(vendor?._id || vendor?.id || vendor?.vendorId);

  const fetchWorkOrders = useCallback(async () => {
    const currentVendor = getVendorFromStorage();

    setVendor(currentVendor);

    const currentVendorId = getId(
      currentVendor?._id ||
      currentVendor?.id ||
      currentVendor?.vendorId
    );

    if (!currentVendorId) {
      setOrders([]);
      setError(
        "NO Vendor Found."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.get("/work-orders", {
        params: { vendorId: currentVendorId },
      });

      const result = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.orders)
          ? response.data.orders
          : [];

      const ownOrders = result.filter((order) => {
        const assignedVendorId = getId(
          order.vendorId ||
          order.vendor?._id ||
          order.vendor?._id?.toString()
        );

        return assignedVendorId === currentVendorId;
      });

      ownOrders.sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate || 0).getTime() -
          new Date(a.createdAt || a.startDate || 0).getTime()
      );

      setOrders(ownOrders);
    } catch (err) {
      console.error("Vendor work orders fetch error:", err);
      setError(
        err?.response?.data?.message ||
        "Work Orders load nahi ho paaye. Please refresh karein."
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const downloadPDF = async (order) => {
    const orderId = String(order._id || order.orderNumber || "");
    setDownloading(orderId);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      if (companyLogo) {
        try {
          doc.addImage(companyLogo, "PNG", 12, 9, 17, 17);
        } catch (err) {
          console.warn("Logo could not be added:", err);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("BARTONS BUILDERS LIMITED", 32, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("WORK ORDER", 32, 23);

      doc.setFontSize(9);
      doc.text(
        `Order No.: ${order.orderNumber || "-"}`,
        12,
        34
      );
      doc.text(
        `Date: ${formatDate(order.createdAt || order.startDate)}`,
        pageWidth - 12,
        34,
        { align: "right" }
      );

      autoTable(doc, {
        startY: 40,
        head: [["WORK ORDER DETAILS", "INFORMATION"]],
        body: [
          ["Project Site", order.site || "-"],
          ["Category", order.category || "-"],
          ["Subcategory", order.subcategory || "-"],
          ["Work / Material Description", order.workDescription || "-"],
          ["Measurement Type", order.measurementType || "-"],
          ["Start Date", formatDate(order.startDate)],
          ["Deadline", formatDate(order.deadline)],
          ["Status", order.status || "Issued"],
          ["Created By", order.createdBy || "-"],
        ],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [44, 62, 80] },
        columnStyles: { 0: { cellWidth: 65 } },
      });

      let finalY = doc.lastAutoTable.finalY + 8;
      const measurements = getMeasurements(order);

      if (measurements.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("MEASUREMENT DETAILS", 12, finalY);

        const measurementRows = measurements.map((item, index) => {
          const rate = getMeasurementRate(order, item);
          const amount = getMeasurementAmount(order, item);

          return [
            item.measurementNo ?? index + 1,
            item.workType || "-",
            item.description || "-",
            formatNumber(item.quantity),
            item.unit || "-",
            rate == null ? "-" : money(rate),
            amount == null ? "-" : money(amount),
            item.remarks || "-",
          ];
        });

        const knownAmounts = measurements
          .map((item) => getMeasurementAmount(order, item))
          .filter((value) => value != null);

        const totalAmount = knownAmounts.reduce(
          (sum, value) => sum + value,
          0
        );

        autoTable(doc, {
          startY: finalY + 3,
          head: [[
            "Sr.",
            "Work Type",
            "Description",
            "Qty",
            "Unit",
            "Rate",
            "Amount",
            "Remarks",
          ]],
          body: measurementRows,
          foot: [[
            "",
            "",
            "",
            "",
            "",
            "Total",
            knownAmounts.length ? money(totalAmount) : "-",
            "",
          ]],
          showFoot: "lastPage",
          theme: "grid",
          styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: "linebreak",
          },
          headStyles: { fillColor: [44, 62, 80] },
          footStyles: {
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          margin: { left: 10, right: 10, bottom: 15 },
        });

        finalY = doc.lastAutoTable.finalY + 8;
      } else if (order.measurementType === "fixed") {
        autoTable(doc, {
          startY: finalY,
          head: [["Quantity", "Unit", "Rate", "Total Amount"]],
          body: [[
            formatNumber(order.quantity),
            order.unit || "-",
            order.rate == null ? "-" : money(order.rate),
            order.totalAmount == null ? "-" : money(order.totalAmount),
          ]],
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [44, 62, 80] },
          margin: { left: 10, right: 10 },
        });

        finalY = doc.lastAutoTable.finalY + 8;
      }

      if (order.totalAmount != null && !measurements.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(
          `Total Amount: ${money(order.totalAmount)}`,
          pageWidth - 12,
          finalY,
          { align: "right" }
        );
        finalY += 10;
      }

      if (finalY > 245) {
        doc.addPage();
        finalY = 25;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Vendor / Contractor Signature: ____________________", 12, finalY + 8);
      doc.text("Authorized Signature: ____________________", pageWidth - 12, finalY + 8, {
        align: "right",
      });

      const fileName =
        `Work_Order_${safeFilename(order.orderNumber)}_` +
        `${safeFilename(order.site)}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output("datauristring").split(",")[1];

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title: `Work Order ${order.orderNumber || ""}`,
          text: `Work Order ${order.orderNumber || ""}`,
          files: [savedFile.uri],
          dialogTitle: "Download / Share Work Order PDF",
        });
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      console.error("Work Order PDF error:", err);
      window.alert(err?.message || "PDF download nahi ho paaya.");
    } finally {
      setDownloading("");
    }
  };

  const toggleDetails = (id) => {
    setExpanded((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  return (
    <div className="vendor-work-orders-page" style={styles.page}>
      <div style={styles.container}>
        <style>{`
          .vendor-work-orders-table th {
            background: #172554;
            color: #ffffff;
            text-align: left;
            padding: 12px 13px;
            white-space: nowrap;
            font-size: 11px;
            letter-spacing: .35px;
            text-transform: uppercase;
          }
          .vendor-work-orders-table td {
            padding: 12px 13px;
            border-top: 1px solid #edf1f7;
            vertical-align: top;
          }
          .vendor-work-orders-table tbody tr:nth-child(even) { background: #f8fafc; }
          .vendor-work-orders-table tbody tr:hover { background: #eff6ff; }
          @media (max-width: 640px) {
            .vendor-work-orders-table th, .vendor-work-orders-table td { padding: 10px; }
          }
        `}</style>
        <div style={styles.header}>
          <div>
            <h2 style={styles.heading}>My Work Orders</h2>
            <p style={styles.subtitle}>
              Welcome, {vendor?.name || vendor?.fullName || "Vendor"}
            </p>
            <p style={styles.subtitle}>
              Vendor Code: {vendor?.vendorCode || "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchWorkOrders}
            disabled={loading}
            style={styles.refreshButton}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading && (
          <div style={styles.message}>Work Orders load ho rahe hain...</div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div style={styles.empty}>
            <h3>No Work Orders Yet</h3>
            <p>
              Abhi aapke naam par koi Work Order issue nahi hua hai.
              Admin ke assign karne ke baad yahan dikh jayega.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            <div style={styles.count}>
              Total Work Orders: <strong>{orders.length}</strong>
            </div>

            <div style={styles.orderList}>
              {orders.map((order) => {
                const id = String(order._id || order.orderNumber);
                const measurements = getMeasurements(order);
                const isExpanded = Boolean(expanded[id]);

                return (
                  <section key={id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <div>
                        <h3 style={styles.orderTitle}>{order.orderNumber || "Work Order"}</h3>
                        <p style={styles.siteText}>Project Site: {order.site || "-"}</p>
                      </div>

                      <span style={styles.status}> {order.status || "Issued"} </span>
                    </div>

                    <div style={styles.detailsGrid}>
                      <div style={styles.detail}>
                        <span>Category</span>
                        <strong>{order.category || "-"}</strong>
                      </div>
                      <div style={styles.detail}>
                        <span>Subcategory</span>
                        <strong>{order.subcategory || "-"}</strong>
                      </div>
                      <div style={styles.detail}>
                        <span>Measurement Type</span>
                        <strong>{order.measurementType || "-"}</strong>
                      </div>
                      <div style={styles.detail}>
                        <span>Created By</span>
                        <strong>{order.createdBy || "Admin"}</strong>
                      </div>
                      <div style={styles.detail}>
                        <span>Start Date</span>
                        <strong>{formatDate(order.startDate)}</strong>
                      </div>
                      <div style={styles.detail}>
                        <span>Deadline</span>
                        <strong>{formatDate(order.deadline)}</strong>
                      </div>
                      <div style={styles.detail}>
                        <span>Issued On</span>
                        <strong>{formatDate(order.createdAt)}</strong>
                      </div>
                      {order.quantity != null && (
                        <div style={styles.detail}>
                          <span>Quantity</span>
                          <strong>
                            {formatNumber(order.quantity)} {order.unit || ""}
                          </strong>
                        </div>
                      )}
                      {order.rate != null && (
                        <div style={styles.detail}>
                          <span>Rate</span>
                          <strong>{money(order.rate)}</strong>
                        </div>
                      )}
                      {order.totalAmount != null && (
                        <div style={styles.detail}>
                          <span>Total Amount</span>
                          <strong>{money(order.totalAmount)}</strong>
                        </div>
                      )}
                    </div>
                    <div style={styles.descriptionBox}>
                      <strong>Work / Material Description</strong>
                      <p>{order.workDescription || "-"}</p>
                    </div>
                    {measurements.length > 0 && (
                      <div style={styles.measurementSection}>
                        <h4 style={styles.sectionHeading}>
                          Assigned Measurement Details ({measurements.length})
                        </h4>

                        <div style={styles.tableWrapper}>
                          <table className="vendor-work-orders-table" style={styles.table}>
                            <thead>
                              <tr>
                                <th>Sr. No.</th>
                                <th>Work Type</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Rate</th>
                                <th>Amount</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {measurements.map((item, index) => {
                                const rate = getMeasurementRate(order, item);
                                const amount = getMeasurementAmount(order, item);

                                return (
                                  <tr key={item._id || `${id}_${index}`}>
                                    <td>{item.measurementNo ?? index + 1}</td>
                                    <td>{item.workType || "-"}</td>
                                    <td>{item.description || "-"}</td>
                                    <td>{formatNumber(item.quantity)}</td>
                                    <td>{item.unit || "-"}</td>
                                    <td style={styles.moneyCell}>
                                      {rate == null ? "Rate Pending" : money(rate)}
                                    </td>
                                    <td style={styles.amountCell}>
                                      {amount == null ? "—" : money(amount)}
                                    </td>
                                    <td>{item.remarks || "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {order.measurementType === "fixed" &&
                      measurements.length === 0 && (
                        <div style={styles.supplyBox}>
                          <strong>Quantity / Rate Details</strong>
                          <p> Quantity: {formatNumber(order.quantity)}{" "} {order.unit || ""}</p>
                          <p> Rate: {order.rate == null ? "-" : money(order.rate)} </p>
                          <p> Total Amount:{" "} {order.totalAmount == null ? "-" : money(order.totalAmount)}</p>
                        </div>
                      )}

                    {/* <div style={styles.actions}>
                      <button type="button" style={styles.secondaryButton} onClick={() => toggleDetails(id)} > {isExpanded ? "Hide Details" : "View Details"} 
                      </button>

                      <button type="button" style={styles.pdfButton} disabled={downloading === id}
                        onClick={() => downloadPDF(order)}>
                        {downloading === id ? "Preparing PDF..." : "⬇ Download / Share PDF"}
                      </button>
                    </div> */}

                    {isExpanded && (
                      <div style={styles.extraDetails}>
                        <p><strong>Work Order No.:</strong> {order.orderNumber || "-"}</p>
                        <p><strong>Vendor:</strong>{" "}{order.vendorName || vendor?.name || "-"}</p>
                        <p> <strong>Vendor Code:</strong>{" "} {order.vendorCode || vendor?.vendorCode || "-"}</p>
                        <p> <strong>Vendor Contact:</strong>{" "} {vendor?.contactNo || vendor?.mobile || "-"}</p>
                        <p><strong>Vendor Email:</strong> {vendor?.email || "-"}</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


const styles = {
  page: {
    minHeight: "100vh",
    padding: "88px 20px 40px",
    background: "linear-gradient(135deg, #eef2f7 0%, #e5eaf2 100%)",
    color: "#1e293b",
    boxSizing: "border-box",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: "1450px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "clamp(16px, 3vw, 32px)",
    borderRadius: "20px",
    border: "1px solid #dce4ef",
    boxShadow: "0 16px 45px rgba(16, 35, 65, 0.08)",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    borderBottom: "2px solid #edf0f5",
    paddingBottom: "23px",
    marginBottom: "24px",
  },

  heading: {
    margin: "0 0 9px",
    fontSize: "clamp(24px, 3vw, 32px)",
    fontWeight: 850,
    letterSpacing: "-0.8px",
    color: "#122747",
  },

  subtitle: {
    margin: "5px 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  refreshButton: {
    padding: "12px 19px",
    background: "linear-gradient(135deg, #17365d, #102747)",
    color: "#ffffff",
    border: "1px solid #294b73",
    borderRadius: "10px",
    fontWeight: 750,
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(18, 39, 71, 0.17)",
  },

  count: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    margin: "0 0 20px",
    padding: "10px 15px",
    borderRadius: "10px",
    background: "#f7f2e7",
    border: "1px solid #eadbb9",
    color: "#76551a",
    fontSize: "13px",
  },

  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  orderCard: {
    background: "#ffffff",
    border: "1px solid #dce4ee",
    borderTop: "4px solid #c49a48",
    borderRadius: "15px",
    padding: "clamp(16px, 2vw, 25px)",
    minWidth: 0,
    boxShadow: "0 6px 22px rgba(15, 35, 65, 0.055)",
    transition: "box-shadow 0.2s ease",
  },

  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    borderBottom: "1px solid #e8edf4",
    paddingBottom: "18px",
    marginBottom: "20px",
  },

  orderTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 850,
    color: "#142e50",
    letterSpacing: "-0.4px",
  },

  siteText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  status: {
    display: "inline-block",
    padding: "8px 13px",
    borderRadius: "8px",
    background: "#eaf7ef",
    border: "1px solid #b8e2c7",
    color: "#187344",
    fontSize: "11px",
    fontWeight: 850,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "13px",
  },

  detail: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "15px",
    background: "linear-gradient(145deg, #ffffff, #f6f8fb)",
    border: "1px solid #e3e9f1",
    borderRadius: "12px",
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  descriptionBox: {
    marginTop: "18px",
    padding: "17px",
    background: "#f7f9fc",
    border: "1px solid #e0e7f0",
    borderLeft: "4px solid #c49a48",
    borderRadius: "10px",
    overflowWrap: "anywhere",
    color: "#334155",
    lineHeight: 1.7,
  },

  sectionHeading: {
    margin: "0 0 15px",
    fontSize: "16px",
    fontWeight: 850,
    color: "#142e50",
  },

  measurementSection: {
    marginTop: "25px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #dce4ee",
    borderRadius: "12px",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  table: {
    width: "100%",
    minWidth: "850px",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "12px",
    color: "#334155",
  },

  moneyCell: {
    color: "#9a6b18",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },

  amountCell: {
    color: "#08764f",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  supplyBox: {
    marginTop: "18px",
    padding: "18px",
    border: "1px solid #e4d5b4",
    borderLeft: "4px solid #c49a48",
    borderRadius: "12px",
    background: "#fbf8f0",
    color: "#34445b",
    lineHeight: 1.8,
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "11px",
    marginTop: "22px",
  },

  secondaryButton: {
    padding: "12px 17px",
    background: "#ffffff",
    color: "#183454",
    border: "1px solid #cbd6e4",
    borderRadius: "9px",
    fontWeight: 750,
    cursor: "pointer",
  },

  pdfButton: {
    padding: "12px 18px",
    background: "linear-gradient(135deg, #16764e, #105b3c)",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontWeight: 750,
    cursor: "pointer",
    boxShadow: "0 5px 13px rgba(16, 91, 60, 0.17)",
  },

  extraDetails: {
    marginTop: "16px",
    padding: "17px",
    border: "1px solid #dfe6ef",
    borderRadius: "12px",
    background: "#f7f9fc",
    color: "#475569",
    overflowWrap: "anywhere",
    lineHeight: 1.7,
  },

  error: {
    marginTop: "20px",
    padding: "15px 17px",
    borderRadius: "11px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  message: {
    marginTop: "22px",
    padding: "30px 20px",
    textAlign: "center",
    border: "1px solid #dfe6ef",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#64748b",
  },

  empty: {
    marginTop: "25px",
    padding: "45px 22px",
    textAlign: "center",
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "15px",
    color: "#64748b",
    lineHeight: 1.8,
  },
};


export default VendorWorkOrders;
