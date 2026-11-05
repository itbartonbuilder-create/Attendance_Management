
import React, { useEffect, useState } from "react";
import API from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import companyLogo from "../assets/logo.png";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";


const WORK_CATEGORIES = ["Composite", "Civil", "Electrical"];

const SUPPLY_CATEGORIES = [
  "Aggregate", "Sand", "Cement", "Hardware", "Tiles",
  "Steel", "Paints", "Wood", "Glass", "Other",
];

const SUBCATEGORIES = {
  Aggregate: ["10mm Aggregate", "20mm Aggregate", "40mm Aggregate", "Stone Dust", "Other"],
  Sand: ["River Sand", "M-Sand", "Plaster Sand", "Other"],
  Cement: ["OPC Cement", "PPC Cement", "White Cement", "Other"],
  Hardware: ["Nails", "Screws", "Binding Wire", "Fasteners", "Other"],
  Tiles: ["Floor Tiles", "Wall Tiles", "Parking Tiles", "Other"],
  Steel: ["TMT Bar 8mm", "TMT Bar 10mm", "TMT Bar 12mm", "TMT Bar 16mm", "TMT Bar 20mm", "Binding Wire", "Structural Steel", "Other"],
  Paints: ["Primer", "Interior Paint", "Exterior Paint", "Putty", "Enamel Paint", "Other"],
  Wood: ["Plywood", "Timber", "Flush Door", "Other"],
  Glass: ["Clear Glass", "Toughened Glass", "Laminated Glass", "Other"],
  Other: ["Other"],
  Composite: ["Civil + Electrical", "Civil + Plumbing", "Civil + Electrical + Plumbing", "Complete Building Work", "Other"],
  Civil: ["Excavation", "Earthwork", "Backfilling", "PCC", "RCC", "Reinforcement Steel", "Shuttering / Formwork", "Brick Work", "Block Work", "Plaster Work", "Putty Work", "Painting", "Waterproofing", "Flooring", "Tiling", "Marble / Granite", "False Ceiling", "Road Work", "Interlock Paver", "Demolition", "Other"],
  Electrical: ["Conduit Installation", "Wiring", "Cable Laying", "Cable Tray", "Panel Installation", "DB Installation", "Switch / Socket Installation", "Light Installation", "Fan Installation", "Earthing", "Electrical Testing", "Fire Alarm", "CCTV", "Other"],
};

const UNITS = [
  "Nos", "Room", "Rft", "Sqft", "Sqm", "Cft", "Cum",
  "Kg", "Ton", "Bag", "Litre", "Job", "LS",
];

// const STATUSES = ["Issued", "In Progress", "Completed", "Cancelled"];

const EMPTY_FORM = {
  mobile: "",
  category: "",
  subcategory: "",
  customSubcategory: "",
  site: "",
  workDescription: "",
  quantity: "",
  unit: "Job",
  rate: "",
  startDate: "",
  deadline: "",
  measurementType: "Select",
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function getVendorCategory(vendor) {
  const category = vendor?.category;
  return Array.isArray(category)
    ? String(category[0] || "").trim()
    : String(category || "").trim();
}

function getVendorTypeLabel(type) {
  if (String(type).toLowerCase() === "supply") return "Supply";
  if (String(type).toLowerCase() === "work") return "Work";
  return type || "—";
}

function isWorkVendor(vendor) {
  return String(vendor?.vendorType || "").toLowerCase() === "work";
}

function isSupplyVendor(vendor) {
  return String(vendor?.vendorType || "").toLowerCase() === "supply";
}

export default function WorkOrders() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const initialSite = String(savedUser.siteId || savedUser.site || "");

  const [form, setForm] = useState({ ...EMPTY_FORM, site: initialSite });
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [allSites, setAllSites] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurementIds, setSelectedMeasurementIds] = useState([]);

  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [approvalOrder, setApprovalOrder] = useState(null);
  const [approvalItems, setApprovalItems] = useState([]);
  const [savingApproval, setSavingApproval] = useState(false);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [billOrder, setBillOrder] = useState(null);
    const [billHistory, setBillHistory] = useState([]);
    const [billSummary, setBillSummary] = useState({
      approvedAmount: 0,
      totalPaid: 0,
      outstanding: 0,
    });
    const [billForm, setBillForm] = useState({
      paymentAmount: "",
      paymentMode: "Cash",
      paymentDate: new Date().toISOString().slice(0, 10),
      remarks: "",
    });
    const [loadingBills, setLoadingBills] = useState(false);
    const [savingBill, setSavingBill] = useState(false);
    const [paymentProof, setPaymentProof] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [siteFilter, setSiteFilter] = useState("All");

  const styles = {
    page: {
      padding: "30px 20px",
      maxWidth: "1400px",
      margin: "0 auto",
      color: "#e5e7eb",
      boxSizing: "border-box",
      width: "100%",
    },
    panel: {
      background: "#1f2937",
      padding: "24px",
      borderRadius: "12px",
      marginBottom: "24px",
      border: "1px solid #374151",
      boxSizing: "border-box",
      minWidth: 0,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
      gap: "16px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      marginBottom: "6px",
      color: "#d1d5db",
      fontWeight: "500",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "11px",
      borderRadius: "7px",
      border: "1px solid #4b5563",
      background: "#111827",
      color: "#fff",
      outline: "none",
      minWidth: 0,
    },
    button: {
      padding: "11px 18px",
      border: "none",
      borderRadius: "7px",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
    tableWrap: { overflowX: "auto", width: "100%" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "1100px" },
    th: {
      padding: "12px",
      textAlign: "left",
      background: "#374151",
      borderBottom: "1px solid #4b5563",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #374151",
      verticalAlign: "top",
    },
  };

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const next = { ...previous, [name]: value };

      if (name === "subcategory" && value !== "Other") {
        next.customSubcategory = "";
      }

      if (name === "startDate" && next.deadline && next.deadline < value) {
        next.deadline = "";
      }

      return next;
    });

    if (name === "site" || name === "measurementType") {
      setSelectedMeasurementIds([]);
    }
  };

  const fetchAllSites = async () => {
    try {
      const response = await API.get("/sites");
      setAllSites(
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.sites)
            ? response.data.sites
            : []
      );
    } catch (error) {
      console.error("Fetch sites error:", error);
      showMessage("Unable to load project sites.", "error");
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await API.get("/work-orders");
      setOrders(
        Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.orders)
            ? response.data.orders
            : []
      );
    } catch (error) {
      console.error("Work order history error:", error);
      showMessage(
        error.response?.data?.message || "Unable to load Work Order history.",
        "error"
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadMeasurements = async () => {
    if (!form.site || !["fixed", "calculating"].includes(form.measurementType)) {
      setMeasurements([]);
      return;
    }

    try {
      setLoadingMeasurements(true);

      const response = await API.get("/measurement", {
        params: {
          site: form.site,
          measurementType: form.measurementType,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.measurements)
          ? response.data.measurements
          : [];

     const available = data
  .filter((item) => !item.workOrderId && item._id)
  .sort((a, b) => {
    const getNumber = (item) => {
      const value = String(item.measurementNo ?? "");
      const match = value.match(/\d+/);
      return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
    };

    return getNumber(a) - getNumber(b);
  });

      setMeasurements(available);

      setSelectedMeasurementIds((previous) =>
        previous.filter((id) => available.some((item) => item._id === id))
      );
    } catch (error) {
      console.error("Load measurements error:", error);
      setMeasurements([]);
      showMessage(
        error.response?.data?.message ||
          "Unable to load saved measurements. Check the measurement API.",
        "error"
      );
    } finally {
      setLoadingMeasurements(false);
    }
  };

  useEffect(() => {
    fetchAllSites();
    loadOrders();
  }, []);

  useEffect(() => {
    setSelectedMeasurementIds([]);
    if (isWorkVendor(vendor)) {
      loadMeasurements();
    } else {
      setMeasurements([]);
    }
  }, [form.site, form.measurementType, vendor?._id]);

  const searchVendor = async () => {
    const mobile = form.mobile.trim();

    if (!mobile) {
      showMessage("Enter vendor contact number first.", "error");
      return;
    }

    try {
      setSearching(true);
      setVendor(null);
      setMeasurements([]);
      setSelectedMeasurementIds([]);
      setMessage("");

      const response = await API.get("/work-orders/vendors/search", {
        params: { mobile },
      });

      const foundVendor = response.data?.vendor || response.data;

      if (!foundVendor?._id) {
        throw new Error("Registered vendor details not found.");
      }

      if (String(foundVendor.status).toLowerCase() !== "approved") {
        throw new Error("Vendor is not approved yet.");
      }

      const type = String(foundVendor.vendorType || "").toLowerCase();
      const category = getVendorCategory(foundVendor);
      const allowedCategories =
        type === "supply"
          ? SUPPLY_CATEGORIES
          : type === "work"
            ? WORK_CATEGORIES
            : [];

      if (!allowedCategories.includes(category)) {
        throw new Error(
          "Vendor type or registered category is invalid. Check vendor registration."
        );
      }

      setVendor(foundVendor);
      setForm((previous) => ({
        ...previous,
        category,
        subcategory: "",
        customSubcategory: "",
      }));

      showMessage(
        `${getVendorTypeLabel(type)} vendor found. Category selected automatically.`,
        "success"
      );
    } catch (error) {
      setVendor(null);
      showMessage(
        error.response?.data?.message || error.message || "Vendor search failed.",
        "error"
      );
    } finally {
      setSearching(false);
    }
  };

  const toggleMeasurement = (measurementId) => {
    setSelectedMeasurementIds((previous) =>
      previous.includes(measurementId)
        ? previous.filter((id) => id !== measurementId)
        : [...previous, measurementId]
    );
  };

  const selectedMeasurements = measurements.filter((item) =>
    selectedMeasurementIds.includes(item._id)
  );

  const selectedQuantity = selectedMeasurements.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const selectedAmount = selectedMeasurements.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const selectedUnits = [
    ...new Set(selectedMeasurements.map((item) => item.unit).filter(Boolean)),
  ];

  const createWorkOrder = async (event) => {
    event.preventDefault();

    if (!vendor?._id) {
      showMessage("Search an approved registered vendor first.", "error");
      return;
    }

    const category = getVendorCategory(vendor);
    const type = String(vendor.vendorType || "").toLowerCase();

    if (form.category !== category) {
      showMessage("Vendor category does not match registration.", "error");
      return;
    }

    if (!(SUBCATEGORIES[category] || []).includes(form.subcategory)) {
      showMessage("Please select a valid subcategory.", "error");
      return;
    }

    if (form.subcategory === "Other" && !form.customSubcategory.trim()) {
      showMessage("Please enter the custom subcategory.", "error");
      return;
    }

    if (!form.site.trim() || !form.workDescription.trim()) {
      showMessage("Please select a site and enter the description.", "error");
      return;
    }

    if (!form.startDate || !form.deadline) {
      showMessage("Please select both Start Date and Deadline.", "error");
      return;
    }

    if (form.deadline < form.startDate) {
      showMessage("Deadline cannot be before start date.", "error");
      return;
    }

    if (type === "work" && selectedMeasurementIds.length === 0) {
      showMessage(
        "Select at least one saved measurement before issuing this Work Order.",
        "error"
      );
      return;
    }

    if (type === "supply") {
      if (
        !form.quantity ||
        Number(form.quantity) <= 0 ||
        form.rate === "" ||
        !Number.isFinite(Number(form.rate)) ||
        Number(form.rate) < 0 ||
        !form.unit
      ) {
        showMessage(
          "Enter a valid Supply quantity, unit and rate.",
          "error"
        );
        return;
      }
    }

    const payload = {
      vendorId: vendor._id,
      category,
      subcategory:
        form.subcategory === "Other"
          ? form.customSubcategory.trim()
          : form.subcategory,
      site: form.site.trim(),
      workDescription: form.workDescription.trim(),
      startDate: form.startDate,
      deadline: form.deadline,
      // createdBy:
      //   savedUser.name ||
      //   savedUser.fullName ||
      //   savedUser.username ||
      //   "Admin",
    };

    if (type === "work") {
      payload.measurementIds = selectedMeasurementIds;
      payload.measurementType = form.measurementType;
    } else {
      payload.quantity = Number(form.quantity);
      payload.unit = form.unit;
      payload.rate = Number(form.rate);
      payload.measurementType = "fixed";
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await API.post("/work-orders", payload);

      showMessage(
        response.data?.message || "Work Order issued successfully.",
        "success"
      );

      const keepSite = form.site;
      setForm({ ...EMPTY_FORM, site: keepSite });
      setVendor(null);
      setMeasurements([]);
      setSelectedMeasurementIds([]);
      await loadOrders();
    } catch (error) {
      console.error("Create Work Order error:", error);
      showMessage(
        error.response?.data?.message || "Unable to issue Work Order.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };
  

const openRateApproval = (order) => {
  const vendorInfo =
    order.vendorId && typeof order.vendorId === "object"
      ? order.vendorId
      : {};

  const vendorType = String(
    order.vendorType || vendorInfo.vendorType || ""
  ).toLowerCase();

  if (vendorType !== "work") {
    showMessage("Rate Approval is only for Work Vendors.", "error");
    return;
  }

  if (String(order.measurementType || "").toLowerCase() !== "calculating") {
    showMessage(
      "Rate Approval is only required for Calculating Measurements.",
      "error"
    );
    return;
  }

  const linkedMeasurements = Array.isArray(order.measurementIds)
    ? order.measurementIds.filter(
        (item) => item && typeof item === "object" && item._id
      )
    : [];

  if (linkedMeasurements.length === 0) {
    showMessage(
      "Linked measurements were not found. Refresh Work Order History and try again.",
      "error"
    );
    return;
  }

  const approvals = Array.isArray(order.rateApprovals)
    ? order.rateApprovals
    : [];

  setApprovalOrder(order);

  setApprovalItems(
    linkedMeasurements.map((measurement) => {
      const approval = approvals.find(
        (entry) =>
          String(
            entry.measurementId?._id || entry.measurementId
          ) === String(measurement._id)
      );

      return {
        measurementId: String(measurement._id),
        measurementNo: measurement.measurementNo || "—",
        workType: measurement.workType || "—",
        description: measurement.description || "—",
        quantity: Number(measurement.quantity || 0),
        unit: measurement.unit || "—",
        rate:
          approval?.rate !== undefined && approval?.rate !== null
            ? String(approval.rate)
            : "",
        status: approval?.status || "Rate Pending",
      };
    })
  );
};

const updateApprovalRate = (measurementId, rate) => {
  setApprovalItems((previous) =>
    previous.map((item) =>
      item.measurementId === measurementId
        ? { ...item, rate }
        : item
    )
  );
};

const saveRateApprovals = async () => {
  if (!approvalOrder?._id) return;

  const invalidItem = approvalItems.find(
    (item) =>
      item.rate === "" ||
      !Number.isFinite(Number(item.rate)) ||
      Number(item.rate) < 0 ||
      !Number.isFinite(Number(item.quantity)) ||
      Number(item.quantity) <= 0
  );

  if (invalidItem) {
    showMessage(
      `Enter a valid rate for Measurement ${invalidItem.measurementNo}.`,
      "error"
    );
    return;
  }

  try {
    setSavingApproval(true);

    const approvedBy =
      savedUser.name ||
      savedUser.fullName ||
      savedUser.username ||
      "Admin";

    const response = await API.patch(
      `/work-orders/${approvalOrder._id}/rate-approvals`,
      {
        approvedBy,
        items: approvalItems.map((item) => ({
          measurementId: item.measurementId,
          rate: Number(item.rate),
        })),
      }
    );

    showMessage(
      response.data?.message || "Rates approved successfully.",
      "success"
    );

    setApprovalOrder(null);
    setApprovalItems([]);

    await loadOrders();
  } catch (error) {
    console.error("Save rate approvals error:", error);
    showMessage(
      error.response?.data?.message || "Unable to approve rates.",
      "error"
    );
  } finally {
    setSavingApproval(false);
  }
};

const getRateApprovalStatus = (order) => {
  const vendorInfo =
    order.vendorId && typeof order.vendorId === "object"
      ? order.vendorId
      : {};

  const vendorType = String(
    order.vendorType || vendorInfo.vendorType || ""
  ).toLowerCase();

  if (
    vendorType !== "work" ||
    String(order.measurementType || "").toLowerCase() !== "calculating"
  ) {
    return "Not Required";
  }

  const approvals = Array.isArray(order.rateApprovals)
    ? order.rateApprovals
    : [];

  const measurements = Array.isArray(order.measurementIds)
    ? order.measurementIds
    : [];

  if (measurements.length === 0) return "Measurements Missing";

  if (
    approvals.length === measurements.length &&
    approvals.every((item) => item.status === "Approved")
  ) {
    return "Approved";
  }

  if (approvals.some((item) => item.status === "Revision Required")) {
    return "Revision Required";
  }

  return "Rate Pending";
};

const getApprovedWorkAmount = (order) => {
  if (!order) return 0;

  const measurementType = String(
    order.measurementType || ""
  ).toLowerCase();

  const measurements = Array.isArray(order.measurementIds)
    ? order.measurementIds.filter(
        (item) => item && typeof item === "object"
      )
    : [];

  // Calculating measurements: only approved rates count.
  if (measurementType === "calculating" && measurements.length > 0) {
    const approvals = Array.isArray(order.rateApprovals)
      ? order.rateApprovals
      : [];

    return measurements.reduce((total, measurement) => {
      const approval = approvals.find(
        (item) =>
          String(item.measurementId?._id || item.measurementId) ===
          String(measurement._id)
      );

      if (
        approval?.status !== "Approved" ||
        approval.rate == null
      ) {
        return total;
      }

      const amount =
        approval.amount != null
          ? Number(approval.amount)
          : Number(measurement.quantity || 0) *
            Number(approval.rate);

      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }

  if (measurements.length > 0) {
    return measurements.reduce((total, item) => {
      const amount =
        item.amount != null
          ? Number(item.amount)
          : Number(item.quantity || 0) * Number(item.rate || 0);

      return total + (
        Number.isFinite(amount) && amount >= 0 ? amount : 0
      );
    }, 0);
  }

  const total = Number(
    order.totalAmount ??
    (Number(order.quantity || 0) * Number(order.rate || 0))
  );

  return Number.isFinite(total) ? total : 0;
};


const openBillModal = async (order) => {
  const approvedAmount = getApprovedWorkAmount(order);

  setBillOrder(order);
  setBillHistory([]);
  setBillSummary({
    approvedAmount,
    totalPaid: 0,
    outstanding: approvedAmount,
  });

  setBillForm({
    paymentAmount: "",
    paymentMode: "Cash",
    paymentDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  setPaymentProof(null);

  await loadBillHistory(order._id, approvedAmount);
};



const loadBillHistory = async (orderId, amountFromOrder) => {
  try {
    setLoadingBills(true);

    const response = await API.get(
      `/work-orders/${orderId}/bills`
    );

    const bills = Array.isArray(response.data?.bills)
      ? response.data.bills
      : [];

    const totalPaid = Number(response.data?.totalPaid || 0);

    const approvedAmount = Number.isFinite(amountFromOrder)
      ? amountFromOrder
      : getApprovedWorkAmount(billOrder);

    setBillHistory(bills);

    setBillSummary({
      approvedAmount,
      totalPaid,
      outstanding: Math.max(0, approvedAmount - totalPaid),
    });
  } catch (error) {
    console.error("Bill history error:", error);

    showMessage(
      error.response?.data?.message ||
        "Unable to load payment history.",
      "error"
    );
  } finally {
    setLoadingBills(false);
  }
};

const downloadPaymentBillPDF = async (bill) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    const formatDate = (value) => {
      if (!value) return "—";

      const date = new Date(value);

      return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-IN");
    };

    try {
      if (companyLogo) {
        doc.addImage(companyLogo, "PNG", margin, 10, 19, 19);
      }
    } catch (error) {
      console.warn("Bill PDF logo error:", error);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("BARTONS BUILDERS", 37, 16);

    doc.setFontSize(13);
    doc.text(
      "LIMITED",
      37 +
        doc.getTextWidth("BARTONS BUILDERS") / 2 -
        doc.getTextWidth("LIMITED") / 2,
      23
    );

    doc.setFontSize(11);
    doc.text("PAYMENT BILL", pageWidth - margin, 16, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Bill No.: ${bill.billNumber || "—"}`,
      pageWidth - margin,
      23,
      { align: "right" }
    );

    autoTable(doc, {
      startY: 36,
      head: [["WORK ORDER / VENDOR DETAILS", "DETAILS"]],
      body: [
        ["Work Order No.", bill.orderNumber || "—"],
        ["Vendor", bill.vendorName || "—"],
        ["Vendor Mobile", bill.vendorMobile || "—"],
        ["Project Site", bill.site || "—"],
        ["Payment Date", formatDate(bill.paymentDate)],
        ["Payment Mode", bill.paymentMode || "—"],
        // ["Created By", bill.createdBy || "Admin"],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255],
      },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [["Description", "Quantity", "Unit", "Rate (₹)", "Amount (₹)"]],
      body: (bill.items || []).map((item) => [
        item.description || "—",
        item.quantity ?? "—",
        item.unit || "—",
        money(item.rate),
        money(item.amount),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 28 },
        4: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      body: [
        ["Approved Work Amount", `Rs. ${money(bill.approvedAmount)}`],
        ["Previously Paid", `Rs. ${money(bill.previouslyPaid)}`],
        ["This Payment", `Rs. ${money(bill.paymentAmount)}`],
        ["Balance After Payment", `Rs. ${money(bill.balanceAfter)}`],
        ["Remarks", bill.remarks || "—"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 75, fontStyle: "bold" },
        1: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    const safeBillNumber = String(
      bill.billNumber || "PaymentBill"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName = `${safeBillNumber}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output("datauristring").split(",")[1];

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
        recursive: true,
      });

      await Share.share({
        title: `Payment Bill ${bill.billNumber || ""}`,
        text: `${bill.orderNumber || "Work Order"} - ${bill.vendorName || "Vendor"}`,
        files: [savedFile.uri],
        dialogTitle: "Share Payment Bill PDF",
      });
    } else {
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Payment Bill PDF error:", error);

    showMessage(
      error?.message || "Unable to generate Payment Bill PDF.",
      "error"
    );
  }
};

const createPaymentBill = async (event) => {
  event.preventDefault();

  if (!billOrder?._id) return;

  const amount = Number(billForm.paymentAmount);
  const paymentMode = billForm.paymentMode;

  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage("Enter a valid payment amount.", "error");
    return;
  }

  if (!billForm.paymentDate) {
    showMessage("Please select payment date.", "error");
    return;
  }

  if (paymentMode === "UPI / Online" && !paymentProof) {
    showMessage(
      "UPI / Online payment ke liye proof image upload karein.",
      "error"
    );
    return;
  }

  if (paymentProof) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(paymentProof.type)) {
      showMessage(
        "Only JPG, PNG and WEBP images are allowed.",
        "error"
      );
      return;
    }

    if (paymentProof.size > 5 * 1024 * 1024) {
      showMessage("Image size must be 5 MB or less.", "error");
      return;
    }
  }

  try {
    setSavingBill(true);

    const formData = new FormData();

    formData.append("paymentAmount", String(amount));
    formData.append("paymentMode", paymentMode);
    formData.append("paymentDate", billForm.paymentDate);
    formData.append("remarks", billForm.remarks);
    formData.append(
      "createdBy",
      savedUser.name ||
        savedUser.fullName ||
        savedUser.username ||
        "Admin"
    );

    if (paymentProof) {
      formData.append("paymentProof", paymentProof);
    }

    const response = await API.post(
      `/work-orders/${billOrder._id}/bills`,
      formData
    );

    const createdBill = response.data?.bill;

    showMessage(
      response.data?.message || "Bill created successfully.",
      "success"
    );

    setPaymentProof(null);

    await loadBillHistory(billOrder._id);

    if (createdBill) {
      await downloadPaymentBillPDF(createdBill);
    }

    setBillForm((previous) => ({
      ...previous,
      paymentAmount: "",
      remarks: "",
    }));
  } catch (error) {
    console.error("Create bill error:", error);

    showMessage(
      error.response?.data?.message ||
        "Unable to create payment bill.",
      "error"
    );
  } finally {
    setSavingBill(false);
  }
};

const downloadWorkOrderPDF = async (order) => {
  try {
    if (!order) {
      showMessage("Work Order details not found.", "error");
      return;
    }

    const vendorInfo =
      (order.vendor && typeof order.vendor === "object" ? order.vendor : null) ||
      (order.vendorId && typeof order.vendorId === "object"
        ? order.vendorId
        : null) ||
      (order.vendorDetails && typeof order.vendorDetails === "object"
        ? order.vendorDetails
        : {});

    const firstValue = (...values) => {
      for (const value of values) {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return value;
        }
      }
      return "—";
    };

    const vendorName = firstValue(
      order.vendorName,
      vendorInfo.name,
      vendorInfo.fullName,
      vendorInfo.vendorName
    );

    const vendorType = firstValue(
      order.vendorType,
      vendorInfo.vendorType,
      vendorInfo.type
    );

    const companyName = firstValue(
      order.vendorCompanyName,
      order.companyName,
      vendorInfo.companyName,
      vendorInfo.company,
      vendorInfo.firmName,
      vendorInfo.businessName
    );

    const vendorMobile = firstValue(
      order.vendorMobile,
      order.vendorContact,
      order.mobile,
      vendorInfo.contactNo,
      vendorInfo.mobile,
      vendorInfo.phone,
      vendorInfo.phoneNumber
    );

    const vendorEmail = firstValue(
      order.vendorEmail,
      vendorInfo.email,
      vendorInfo.emailAddress
    );

    const vendorCategory = firstValue(
      getVendorCategory(vendorInfo),
      order.vendorCategory,
      order.category
    );

    const gstNumber = firstValue(
      order.gstNumber,
      order.gstNo,
      vendorInfo.gstNumber,
      vendorInfo.gstNo,
      vendorInfo.gstin,
      vendorInfo.GST
    );

    const vendorCode = firstValue(
      order.vendorCode,
      vendorInfo.vendorCode,
      vendorInfo.code
    );

    const formatDate = (value) => {
      if (!value) return "—";

      const raw = String(value).slice(0, 10);
      const parts = raw.split("-");

      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      const date = new Date(value);

      return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-IN");
    };
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    const sectionHeading = {
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    };

    const commonStyles = {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
    };
try {
  if (companyLogo) {
    doc.addImage(companyLogo, "PNG", margin, 10, 19, 19);
  }
} catch (logoError) {
  console.warn("Company logo could not be added to PDF:", logoError);
}

doc.setFont("helvetica", "bold");
doc.setFontSize(13);
doc.setTextColor(31, 41, 55);

doc.text("BARTONS BUILDERS", 37, 16);
doc.setFontSize(13);
// doc.text("LIMITED", 37, 23);
doc.text("LIMITED", 37 + doc.getTextWidth("BARTONS BUILDERS") / 2 - doc.getTextWidth("LIMITED") / 2, 23);

doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("WORK ORDER", pageWidth - margin, 16, {
  align: "right",
});

doc.setFont("helvetica", "normal");
doc.setFontSize(8);

doc.text(
  `Order No.: ${String(firstValue(order.orderNumber, order._id))}`,
  pageWidth - margin,
  22,
  { align: "right" }
);

doc.text(
  `Generated: ${formatDate(new Date())}`,
  pageWidth - margin,
  27,
  { align: "right" }
);

doc.setDrawColor(156, 163, 175);
doc.line(margin, 33, pageWidth - margin, 33);


    autoTable(doc, {
      startY: 38,
      head: [["VENDOR INFORMATION", "DETAILS"]],
      body: [
        ["Vendor Name", String(vendorName)],
        ["Vendor Type", String(vendorType)],
        ["Company / Firm Name", String(companyName)],
        ["Contact Number", String(vendorMobile)],
        ["Email", String(vendorEmail)],
        ["Registered Category", String(vendorCategory)],
        ["GST Number", String(gstNumber)],
        ["Vendor Code", String(vendorCode)],
      ],
      theme: "grid",
      headStyles: sectionHeading,
      styles: commonStyles,
      columnStyles: {
        0: { cellWidth: 52, fontStyle: "bold" },
        1: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });


    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [["WORK ORDER INFORMATION", "DETAILS"]],
      body: [
        [
          "Order Number",
          String(firstValue(order.orderNumber, order._id)),
        ],
        [
          "Project Site",
          String(firstValue(order.site, order.siteName)),
        ],
        ["Category", String(firstValue(order.category))],
        ["Subcategory", String(firstValue(order.subcategory))],
        [
          "Work / Material Description",
          String(
            firstValue(order.workDescription, order.description)
          ),
        ],
        [
          "Measurement Type",
          String(firstValue(order.measurementType)),
        ],
        ["Start Date", formatDate(order.startDate)],
        ["Deadline", formatDate(order.deadline)],
        ["Status", String(firstValue(order.status, "Issued"))],
        // ["Created By", String(firstValue(order.createdBy))],
      ],
      theme: "grid",
      headStyles: sectionHeading,
      styles: commonStyles,
      columnStyles: {
        0: { cellWidth: 52, fontStyle: "bold" },
        1: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });



const linkedMeasurements = Array.isArray(order.measurementIds)
  ? order.measurementIds.filter(
      (item) => item && typeof item === "object"
    )
  : [];

const measurementType = String(
  order.measurementType || ""
).toLowerCase().trim();

const isFixed = measurementType === "fixed";
const isCalculating = measurementType === "calculating";
const rateApprovals = Array.isArray(order.rateApprovals)
  ? order.rateApprovals
  : [];

const getApprovalForMeasurement = (measurementId) =>
  rateApprovals.find(
    (entry) =>
      String(entry.measurementId?._id || entry.measurementId) ===
      String(measurementId)
  );

if (linkedMeasurements.length > 0) {
 const headers = isFixed
  ? [
      "Sr. No.",
      "Work Type",
      "Description",
      "Quantity",
      "Unit",
      "Rate (Rs.)",
      "Amount (Rs.)",
    ]
  : isCalculating
    ? [
        "Sr. No.",
        "Work Type",
        "Description",
        "Length",
        "Breadth",
        "Height",
        "Quantity",
        "Unit",
        "Rate (Rs.)",
        "Amount (Rs.)",
        "Rate Status",
      ]
    : [
        "Sr. No.",
        "Work Type",
        "Description",
        "Length",
        "Breadth",
        "Height",
        "Quantity",
        "Unit",
      ];

  const rows = linkedMeasurements.map((item, index) => {
    const row = [
      item.measurementNo || index + 1,
      item.workType || "—",
      item.description || "—",
    ];

    if (isCalculating) {
  const approval = getApprovalForMeasurement(item._id);

  const isApproved =
    approval?.status === "Approved" &&
    approval.rate !== null &&
    approval.rate !== undefined &&
    approval.amount !== null &&
    approval.amount !== undefined;

  row.push(
    item.length ?? "—",
    item.breadth ?? "—",
    item.height ?? "—",
    item.quantity ?? "—",
    item.unit || "—",
    isApproved ? `Rs. ${money(approval.rate)}` : "Pending",
    isApproved ? `Rs. ${money(approval.amount)}` : "Pending",
    approval?.status || "Rate Pending"
  );
} else {
  row.push(
    item.quantity ?? "—",
    item.unit || "—"
  );
}

    if (isFixed) {
      const hasRate =
        item.rate !== undefined &&
        item.rate !== null &&
        item.rate !== "" &&
        Number.isFinite(Number(item.rate));

      const rate = Number(item.rate);

      const hasAmount =
        item.amount !== undefined &&
        item.amount !== null &&
        item.amount !== "" &&
        Number.isFinite(Number(item.amount));

      const amount = hasAmount
        ? Number(item.amount)
        : Number(item.quantity) * rate;

      const hasValidAmount =
        Number.isFinite(amount) &&
        (hasAmount || hasRate);

      row.push(
        hasRate ? `Rs. ${money(rate)}` : "Pending",
        hasValidAmount ? `Rs. ${money(amount)}` : "Pending"
      );
    }

    return row;
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [headers],
    body: rows,
    theme: "grid",
    headStyles: sectionHeading,
    styles: {
      ...commonStyles,
     fontSize: isCalculating ? 5.5 : 7,
      cellPadding: 2,
      overflow: "linebreak",
    },
   columnStyles: isFixed
  ? {
      0: { cellWidth: 13 },
      1: { cellWidth: 25 },
      2: { cellWidth: "auto" },

      3: { cellWidth: 19 },
      4: { cellWidth: 16 },
      5: { cellWidth: 25 },
      6: { cellWidth: 27 },
    }
  : isCalculating
    ? {
        0: { cellWidth: 10 },
        1: { cellWidth: 19 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 13 },
        4: { cellWidth: 13 },
        5: { cellWidth: 13 },
        6: { cellWidth: 14 },
        7: { cellWidth: 11 },
        8: { cellWidth: 19 },
        9: { cellWidth: 21 },
        10: { cellWidth: 20 },
      }
    : {
        0: { cellWidth: 12 },
        1: { cellWidth: 23 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 15 },
      },
    margin: { left: margin, right: margin },
  });

  if (isFixed) {
    const amounts = linkedMeasurements.map((item) => {
      const hasRate =
        item.rate !== undefined &&
        item.rate !== null &&
        item.rate !== "" &&
        Number.isFinite(Number(item.rate));

      const hasAmount =
        item.amount !== undefined &&
        item.amount !== null &&
        item.amount !== "" &&
        Number.isFinite(Number(item.amount));

      const amount = hasAmount
        ? Number(item.amount)
        : Number(item.quantity) * Number(item.rate);

      return {
        pending:
          (!hasRate && !hasAmount) ||
          !Number.isFinite(amount),
        amount,
      };
    });

    const hasPending = amounts.some((item) => item.pending);

    const total = amounts.reduce(
      (sum, item) =>
        sum + (item.pending ? 0 : item.amount),
      0
    );

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 2,
      body: [[
        {
          content: "TOTAL MEASUREMENT AMOUNT",
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: hasPending
            ? "Pending"
            : `Rs. ${money(total)}`,
          styles: { fontStyle: "bold", halign: "right" },
        },
      ]],
      theme: "grid",
      styles: commonStyles,
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 45 },
      },
      margin: { left: margin, right: margin },
    });
  }
} else {

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [["MEASUREMENT DETAILS", "VALUE"]],
    body: isCalculating
      ? [
          ["Length", String(firstValue(order.length ?? "—"))],
          ["Breadth", String(firstValue(order.breadth ?? "—"))],
          ["Height", String(firstValue(order.height ?? "—"))],
          ["Quantity", String(firstValue(order.quantity))],
          ["Unit", String(firstValue(order.unit))],
        ]
      : [
          ["Quantity", String(firstValue(order.quantity))],
          ["Unit", String(firstValue(order.unit))],
          [
            "Rate per Unit",
            order.rate == null || order.rate === ""
              ? "Pending"
              : `Rs. ${money(Number(order.rate))}`,
          ],
          [
            "Total Amount",
            order.totalAmount == null &&
            (order.rate == null || order.rate === "")
              ? "Pending"
              : `Rs. ${money(Number(
                  order.totalAmount ??
                  Number(order.quantity || 0) *
                    Number(order.rate || 0)
                ))}`,
          ],
        ],
    theme: "grid",
    headStyles: sectionHeading,
    styles: commonStyles,
    columnStyles: {
      0: { cellWidth: 52, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });
}


    doc.addPage();

    const pageHeight = doc.internal.pageSize.getHeight();
    const termsMargin = 18;
    const bottomMargin = 25;

    const drawTermsBorder = () => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.4);

      doc.rect(
        12,
        12,
        pageWidth - 24,
        pageHeight - 24
      );
    };

    const drawTermsHeading = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);

      doc.text(
        "TERMS & CONDITIONS",
        termsMargin,
        24
      );

      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);

      doc.line(
        termsMargin,
        28,
        pageWidth - termsMargin,
        28
      );
    };

    drawTermsBorder();
    drawTermsHeading();

 
const terms = [
  {
    title: "1. MEASUREMENT AND VERIFICATION:",
    desc: "All measurements shall be recorded with reference to the actual work executed at site and shall be subject to verification by the authorized representative of Bartons Builders Limited in accordance with applicable drawings, specifications and contractual measurement standards.",
  },
  {
    title: "2. ACCEPTANCE OF MEASUREMENTS:",
    desc: "Measurements shall not be treated as finally accepted or certified for payment unless duly checked and approved by the authorized representative of Bartons Builders Limited.",
  },
  {
    title: "3. CONTRACTUAL RATES AND QUANTITIES:",
    desc: "Applicable rates, units, scope of work and payment conditions shall be governed by the accepted Work Order, contract or other written agreement between the parties.",
  },
  {
    title: "4. MEASUREMENT RECORDS:",
    desc: "The contractor shall ensure that all dimensions, quantities, descriptions and supporting records submitted for measurement are accurate and complete. Discrepancies shall be referred to the site representative for reconciliation.",
  },
  {
    title: "5. CONCEALED WORK:",
    desc: "The contractor shall provide reasonable prior notice for inspection and measurement of work that will subsequently be concealed or become inaccessible, in accordance with the applicable contract.",
  },
  {
    title: "6. VARIATION AND EXTRA ITEMS:",
    desc: "Any variation in the approved scope, additional item or revised rate shall require the written approval specified under the applicable contract.",
  },
  {
    title: "7. QUALITY AND RECTIFICATION:",
    desc: "All work shall comply with approved drawings, specifications, quality requirements and contractual obligations. Defective or non-conforming work shall be rectified in accordance with the contract.",
  },
  {
    title: "8. QUANTITY ASSESSMENT:",
    desc: "Quantities shall be calculated using the applicable contractual method of measurement. Deductions, additions and adjustments shall follow the relevant Work Order and agreed measurement rules.",
  },
  {
    title: "9. BILL SUBMISSION AND PAYMENT:",
    desc: "Payment shall be subject to measurement verification, required certification, submission of applicable bills and supporting documents, and compliance with agreed payment terms. This statement alone does not authorize payment.",
  },
  {
    title: "10. TAXES AND STATUTORY COMPLIANCE:",
    desc: "Applicable taxes, statutory deductions and legal compliances shall be handled in accordance with applicable laws and contractual terms.",
  },
  {
    title: "11. SITE SAFETY AND COMPLIANCE:",
    desc: "The contractor shall comply with applicable site safety requirements, lawful site instructions and relevant statutory obligations.",
  },
  {
    title: "12. RECORD AND APPROVAL:",
    desc: "Material discrepancies shall be brought to the attention of the authorized representative before final certification. Corrections and revisions shall be documented and approved through the applicable procedure.",
  },
  {
    title: "13. CONTRACTUAL INTERPRETATION:",
    desc: "In case of inconsistency between this statement and the executed contract or accepted Work Order, the relevant contractual documents shall govern, subject to applicable law.",
  },
  {
    title: "14. ACKNOWLEDGEMENT AND SIGNATURES:",
    desc: "Signatures acknowledge the measurement record only to the extent indicated by the signatories and applicable approval process. They do not independently amend the contract or waive contractual or legal rights.",
  },

  // ADDITIONAL TERMS & CONDITIONS
  {
    title: "15. SCOPE OF WORK AND RESPONSIBILITIES:",
    desc: "The Vendor/Contractor shall execute only the work specified in the approved Work Order, drawings and written instructions issued by the authorized representative of Bartons Builders Limited. Any ambiguity in the scope of work shall be clarified before execution.",
  },
  {
    title: "16. WORK COMMENCEMENT AND PROGRESS:",
    desc: "The Vendor/Contractor shall commence and complete the work within the agreed schedule and maintain reasonable progress as per the site requirements. Any anticipated delay shall be communicated promptly to the authorized site representative.",
  },
  {
    title: "17. DELAY AND EXTENSION OF TIME:",
    desc: "If the work is delayed due to circumstances beyond the Vendor's reasonable control, the Vendor shall notify the Company in writing with supporting details. Any extension of time or applicable consequences shall be determined in accordance with the agreed contract and applicable law.",
  },
  {
    title: "18. MATERIALS AND EQUIPMENT:",
    desc: "Responsibility for supplying materials, tools, equipment and consumables shall be as specified in the Work Order or written agreement. Materials supplied by the Company shall be used only for the authorized project and handled with reasonable care.",
  },
  {
    title: "19. WORKMANSHIP AND DEFECT RECTIFICATION:",
    desc: "The Vendor/Contractor shall execute the work using proper workmanship and approved materials in accordance with the agreed specifications. Defects attributable to the Vendor's work shall be rectified within a reasonable period as agreed between the parties, subject to the applicable contract.",
  },
  {
    title: "20. SITE CLEANLINESS AND HOUSEKEEPING:",
    desc: "The Vendor/Contractor shall keep the assigned work area reasonably clean and orderly, safely store tools and materials, and remove construction debris generated by its work as per site instructions and applicable requirements.",
  },
  {
    title: "21. LABOUR AND PERSONNEL COMPLIANCE:",
    desc: "The Vendor/Contractor shall be responsible for its personnel, wages, supervision and applicable employment-related statutory obligations, as required by law and the agreed contract. Personnel shall follow the Company's applicable site entry, conduct and safety procedures.",
  },
  {
    title: "22. SUBCONTRACTING AND TRANSFER OF WORK:",
    desc: "The Vendor/Contractor shall not subcontract or transfer the assigned work without prior written approval from Bartons Builders Limited, where such approval is required under the applicable contract.",
  },
  {
    title: "23. PAYMENT ADJUSTMENTS AND DEDUCTIONS:",
    desc: "Any deductions, recoveries, retention amounts or adjustments relating to defective work, damage, advance payments or other contractual obligations shall be supported by appropriate records and applied only as permitted under the agreed contract and applicable law.",
  },
  {
    title: "24. SUSPENSION OR TERMINATION OF WORK:",
    desc: "Bartons Builders Limited may suspend or terminate the work only in accordance with the applicable contractual provisions and law. Where required, written notice and a reasonable opportunity to remedy a breach shall be provided as specified in the contract.",
  },
  {
    title: "25. FORCE MAJEURE:",
    desc: "Neither party shall be held responsible for a failure or delay to the extent caused by an event beyond its reasonable control, subject to prompt written notification, reasonable mitigation efforts and the applicable contract and law.",
  },
  {
    title: "26. WORK ORDER ACCEPTANCE AND COMMUNICATION:",
    desc: "The Vendor/Contractor shall review the Work Order, including the scope, rates, units, quantities, schedule and applicable conditions, before accepting it. Any discrepancy or objection shall be raised in writing before the affected work is undertaken.",
  },
  {
    title: "27. DISPUTE RESOLUTION:",
    desc: "Any dispute concerning measurements, rates, quality, payment or scope shall first be referred to the authorized representatives of both parties for discussion and resolution. If unresolved, the dispute shall be handled in accordance with the dispute-resolution provisions of the executed contract and applicable law.",
  },
  {
    title: "28. DOCUMENTATION AND RECORD KEEPING:",
    desc: "The Vendor/Contractor shall maintain accurate records of work executed, measurements, approved variations and other documents reasonably required for verification and billing. Such records shall be submitted when requested under the agreed procedure.",
  },
  {
    title: "29. PRECEDENCE OF CONTRACTUAL DOCUMENTS:",
    desc: "These additional conditions shall be read together with the accepted Work Order and any applicable executed agreement. In the event of a conflict, the order of precedence expressly agreed by the parties shall apply, subject to applicable law.",
  },
  {
    title: "30. ACKNOWLEDGEMENT OF ADDITIONAL CONDITIONS:",
    desc: "Acceptance of this Work Order confirms the parties' acknowledgement of the applicable terms and conditions, subject to the agreed contract, authorized written amendments and applicable law.",
  },
];


    let y = 35;

    terms.forEach((term) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);

      const descLines = doc.splitTextToSize(
        term.desc,
        pageWidth - 2 * termsMargin - 8
      );

      const requiredHeight =
        4.5 + descLines.length * 3.4 + 3;

      if (y + requiredHeight > pageHeight - bottomMargin) {
        doc.addPage();
        drawTermsBorder();
        drawTermsHeading();
        y = 35;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);

      doc.text(term.title, termsMargin, y);

      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);

      doc.text(
        descLines,
        termsMargin + 4,
        y
      );

      y += descLines.length * 3.4 + 3;
    });
    const signatureHeight = 24;
    if (y + signatureHeight > pageHeight - 20) {
      doc.addPage();
      drawTermsBorder();
      drawTermsHeading();
      y = 35;
    }

    y += 2;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);

    doc.line(
      termsMargin,
      y,
      pageWidth - termsMargin,
      y
    );

    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    doc.text(
      "For Vendor / Contractor",
      termsMargin,
      y
    );

    doc.text(
      "For Bartons Builders Limited",
      pageWidth - termsMargin,
      y,
      { align: "right" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    doc.text(
      "Name: ______________________",
      termsMargin,
      y + 6
    );

    doc.text(
      "Signature: ___________________",
      termsMargin,
      y + 12
    );

    doc.text(
      "Date: _______________________",
      termsMargin,
      y + 18
    );

    doc.text(
      "Name: ______________________",
      pageWidth - termsMargin,
      y + 6,
      { align: "right" }
    );

    doc.text(
      "Signature: ___________________",
      pageWidth - termsMargin,
      y + 12,
      { align: "right" }
    );

    doc.text(
      "Date: _______________________",
      pageWidth - termsMargin,
      y + 18,
      { align: "right" }
    );

    const safeOrderNumber = String(
      order.orderNumber || order._id || "WorkOrder"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    const safeSite = String(
      order.site || "Site"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName =
      `Work_Order_${safeOrderNumber}_${safeSite}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc
        .output("datauristring")
        .split(",")[1];

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
        recursive: true,
      });

      await Share.share({
        title: `Work Order ${order.orderNumber || ""}`,
        text: `${order.orderNumber || "Work Order"} - ${vendorName}`,
        files: [savedFile.uri],
        dialogTitle: "Share Work Order PDF",
      });
    } else {
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Work Order PDF error:", error);

    showMessage(
      error?.message || "Unable to generate Work Order PDF.",
      "error"
    );
  }
};


  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this Work Order?")) {
      return;
    }

    try {
      await API.delete(`/work-orders/${orderId}`);
      showMessage("Work Order deleted successfully.", "success");
      await loadOrders();
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Unable to delete Work Order.",
        "error"
      );
    }
  };

  const filteredOrders = orders.filter((order) =>
    (statusFilter === "All" || order.status === statusFilter) &&
    (categoryFilter === "All" || order.category === categoryFilter) &&
    (siteFilter === "All" || order.site === siteFilter)
  );

  const vendorDetails = [
    ["Name", vendor?.name],
    ["Vendor Type", getVendorTypeLabel(vendor?.vendorType)],
    ["Email", vendor?.email],
    ["Company Name", vendor?.companyName],
    ["Contact Number", vendor?.contactNo || vendor?.mobile],
    ["Category", getVendorCategory(vendor)],
    ["GST Number", vendor?.gstNumber],
    ["Vendor Code", vendor?.vendorCode],
    ["Status", vendor?.status],
  ];

  return (
    <div style={styles.page}>
      <h2 style={{ marginTop: 0 }}>Work Orders</h2>
      <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
        Issue and manage Work Orders for registered Supply and Work vendors.
      </p>

      {message && (
        <div
          role="status"
          style={{
            padding: "12px",
            borderRadius: "7px",
            marginBottom: "18px",
            background:
              messageType === "error"
                ? "#7f1d1d"
                : messageType === "success"
                  ? "#14532d"
                  : "#374151",
            color: "#fff",
          }}
        >
          {message}
        </div>
      )}

      <section style={styles.panel}>
        <h3 style={{ marginTop: 0 }}>1. Vendor Search</h3>

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Vendor Contact Number *</label>
            <input
              style={styles.input}
              name="mobile"
              value={form.mobile}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  mobile: event.target.value,
                }))
              }
              placeholder="Enter registered contact number"
              inputMode="numeric"
            />
          </div>

          <div style={{ display: "flex", alignItems: "end" }}>
            <button
              type="button"
              style={{ ...styles.button, width: "100%", opacity: searching ? 0.6 : 1 }}
              onClick={searchVendor}
              disabled={searching}
            >
              {searching ? "Searching..." : "Search Vendor"}
            </button>
          </div>
        </div>

        {vendor && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "1px solid #4b5563",
              borderRadius: "8px",
              background: "#111827",
            }}
          >
            <h4 style={{ marginTop: 0 }}>Registered Vendor Details</h4>
            <div style={styles.grid}>
              {vendorDetails.map(([label, value]) => (
                <div key={label}>
                  <label style={styles.label}>{label}</label>
                  <div
                    style={{
                      ...styles.input,
                      overflowWrap: "anywhere",
                      minHeight: "42px",
                    }}
                  >
                    {value !== undefined && value !== null && value !== ""
                      ? String(value)
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
</section>

<section style={styles.panel}>
  <h3 style={{ marginTop: 0 }}>2. Create Work Order</h3>
  <form onSubmit={createWorkOrder}>
    <div style={{ marginBottom: "16px" }}>
      <label style={styles.label}>Project Site *</label>
        <select style={styles.input} name="site" value={form.site} onChange={updateField}required>
          <option value="">-- Select Project Site --</option>
            {allSites.map((site) => (
          <option key={site._id} value={site.siteId || site.name}>
            {site.name} ({site.siteId || site.name})
          </option>
          ))}
        </select>
    </div>
    <div style={styles.grid}>
      <div>
        <label style={styles.label}>Vendor Type</label>
        <div style={{ position: "relative" }}>
         <input style={{ ...styles.input, background: "#1f2937", cursor: "not-allowed",paddingRight: "40px",
          }} value={getVendorTypeLabel(vendor?.vendorType)} placeholder="Search vendor first"readOnly
          title="Vendor Type cannot be changed"
          />
        </div>
      </div>
    <div>
      <label style={styles.label}>Registered Category *</label>
        <div style={{ position: "relative" }}>
         <input style={{...styles.input, background: "#1f2937", cursor: "not-allowed", paddingRight: "40px",
        }} value={form.category} placeholder="Search vendor to load category"readOnly
          title="Registered Category cannot be changed"/>
        </div>
    </div>
    <div>
      <label style={styles.label}>Subcategory *</label>
        <select style={styles.input} name="subcategory" value={form.subcategory} onChange={updateField}
        required disabled={!vendor}>
      <option value="">Select Subcategory</option>
      {(SUBCATEGORIES[form.category] || []).map((item) => (
      <option key={item} value={item}> {item}</option>
      ))}
</select>
  </div>

  {form.subcategory === "Other" && (
    <div>
      <label style={styles.label}>Custom Subcategory *</label>
      <input style={styles.input} name="customSubcategory" value={form.customSubcategory}
        onChange={updateField} placeholder="Enter material or work name" maxLength={150} required/>
    </div>
  )}
</div>


          <div style={{ marginTop: "16px" }}>
            <label style={styles.label}>Work / Material Description *</label>
            <textarea
              style={{ ...styles.input, minHeight: "90px", resize: "vertical", fontFamily: "inherit" }}
              name="workDescription"
              value={form.workDescription}
              onChange={updateField}
              placeholder="Enter detailed work or material supply description..."
              required
            />
          </div>

          {isWorkVendor(vendor) && (
            <div style={{ marginTop: "18px" }}>
              <h4>Measurement Selection</h4>

              <div style={styles.grid}>
                <div>
                  <label style={styles.label}>Measurement Type *</label>
                  <select
                    style={styles.input}
                    name="measurementType"
                    value={form.measurementType}
                    onChange={updateField}
                  >
                    <option value="Select">Select Measurement</option>
                    <option value="fixed">Fixed Measurement</option>
                    <option value="calculating">Calculating Measurement</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "end", gap: "8px" }}>
                  <button
                    type="button"
                    style={{ ...styles.button, background: "#4f46e5", flex: 1 }}
                    onClick={() => {
                      if (!form.site) {
                        showMessage("Select Project Site first.", "error");
                        return;
                      }
                      setMeasurementOpen(true);
                    }}
                  >
                    Open Measurement Tool ↗
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.button, background: "#047857", flex: 1 }}
                    onClick={loadMeasurements}
                    disabled={loadingMeasurements}
                  >
                    {loadingMeasurements ? "Loading..." : "Refresh List"}
                  </button>
                </div>
              </div>

              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                Save measurements in the tool first, close it, then click Refresh List.
                Only measurements not already assigned to a Work Order should be selectable.
              </p>

              <div style={styles.tableWrap}>
                <table style={{ ...styles.table, minWidth: "800px" }}>
                  <thead>
                    <tr>
                      {["Select", "Measurement No.", "Work Type", "Description", "Quantity", "Unit", "Rate", "Amount"].map((heading) => (
                        <th key={heading} style={styles.th}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((item) => (
                      <tr key={item._id}>
                        <td style={styles.td}>
                          <input
                            type="checkbox"
                            checked={selectedMeasurementIds.includes(item._id)}
                            onChange={() => toggleMeasurement(item._id)}
                          />
                        </td>
                        <td style={styles.td}>{item.measurementNo || item._id}</td>
                        <td style={styles.td}>{item.workType || "—"}</td>
                        <td style={styles.td}>{item.description || "—"}</td>
                        <td style={styles.td}>{item.quantity ?? "—"}</td>
                        <td style={styles.td}>{item.unit || "—"}</td>
                        <td style={styles.td}>
                          {item.rate == null ? "—" : `₹${money(item.rate)}`}
                        </td>
                        <td style={styles.td}>
                          {item.amount == null ? "—" : `₹${money(item.amount)}`}
                        </td>
                      </tr>
                    ))}

                    {!loadingMeasurements && measurements.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#9ca3af" }}>
                          No available saved measurements for this site and measurement type.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "14px", padding: "14px", background: "#111827", borderRadius: "8px" }}>
                <strong>Selected Measurements: {selectedMeasurements.length}</strong>
                <div style={{ marginTop: "6px" }}>
                  Combined quantity: {selectedQuantity.toLocaleString("en-IN")}
                  {" · "}Unit{selectedUnits.length === 1 ? "" : "s"}: {selectedUnits.join(", ") || "—"}
                </div>
                {form.measurementType === "fixed" && (
                  <div style={{ marginTop: "6px" }}>
                    Combined amount: ₹{money(selectedAmount)}
                  </div>
                )}
              </div>
            </div>
          )}

          {isSupplyVendor(vendor) && (
            <div style={{ marginTop: "18px" }}>
              <h4>Supply Details</h4>
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                Supply orders do not require Measurement records. Enter the material quantity and rate here.
              </p>

              <div style={styles.grid}>
                <div>
                  <label style={styles.label}>Quantity *</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="quantity"
                    min="0.001"
                    step="any"
                    value={form.quantity}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>Unit *</label>
                  <select style={styles.input} name="unit" value={form.unit} onChange={updateField} required>
                    {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Rate (₹) *</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="rate"
                    min="0"
                    step="any"
                    value={form.rate}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>Total Amount</label>
                  <input
                    style={{ ...styles.input, background: "#1f2937", fontWeight: "700" }}
                    value={`₹${money(Number(form.quantity || 0) * Number(form.rate || 0))}`}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ ...styles.grid, marginTop: "16px" }}>
            <div>
              <label style={styles.label}>Start Date *</label>
              <input
                style={styles.input}
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={updateField}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Deadline *</label>
              <input
                style={styles.input}
                type="date"
                name="deadline"
                min={form.startDate || undefined}
                value={form.deadline}
                onChange={updateField}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving || !vendor?._id}
              style={{
                ...styles.button,
                minWidth: "190px",
                opacity: saving || !vendor?._id ? 0.6 : 1,
              }}
            >
              {saving ? "Saving Work Order..." : "Issue Work Order"}
            </button>
          </div>
  </form>
</section>

      {measurementOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1400px",
              height: "92vh",
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "14px 20px",
                background: "#1f2937",
              }}
            >
              <div>
                <strong>
                  {form.measurementType === "fixed" ? "Fixed Measurement" : "Calculating Measurement"}
                </strong>
                <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
                  Project Site: {form.site}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMeasurementOpen(false);
                  loadMeasurements();
                }}
                style={{ ...styles.button, background: "#dc2626" }}
              >
                Close ✕
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
              <iframe
                key={`${form.site}-${form.measurementType}`}
                title="Site Measurement"
                src={`/#/measurement?site=${encodeURIComponent(form.site)}&date=${encodeURIComponent(form.startDate || new Date().toISOString().split("T")[0])}&measurementType=${encodeURIComponent(form.measurementType)}&embed=true`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {approvalOrder && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 100000,
      background: "rgba(0,0,0,0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "1100px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#1f2937",
        color: "#e5e7eb",
        border: "1px solid #4b5563",
        borderRadius: "12px",
        padding: "22px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Rate Approval</h3>
          <p style={{ color: "#9ca3af", marginBottom: 0 }}>
            Order: {approvalOrder.orderNumber || "—"}
            {" · "}Site: {approvalOrder.site || "—"}
          </p>
        </div>

        <button
          type="button"
          style={{ ...styles.button, background: "#ad6c6c" }}
          onClick={() => {
            setApprovalOrder(null);
            setApprovalItems([]);
          }}
          disabled={savingApproval}
        >
          Close ✕
        </button>
      </div>

      {/* <p style={{ color: "#d1d5db", fontSize: "13px" }}>
        Har measurement ka rate enter karo. Amount quantity × rate se
        calculate hoga. Approve karne par rates permanently save ho jayenge.
      </p> */}

      <div style={styles.tableWrap}>
        <table style={{ ...styles.table, minWidth: "850px" }}>
          <thead>
            <tr>
              {[
                "Measurement No.",
                "Work Type",
                "Description",
                "Quantity",
                "Unit",
                "Rate (₹)",
                "Amount (₹)",
                "Status",
              ].map((heading) => (
                <th key={heading} style={styles.th}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {approvalItems.map((item) => (
              <tr key={item.measurementId}>
                <td style={styles.td}>{item.measurementNo}</td>
                <td style={styles.td}>{item.workType}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={styles.td}>
                  {item.quantity.toLocaleString("en-IN")}
                </td>
                <td style={styles.td}>{item.unit}</td>

                <td style={{ ...styles.td, minWidth: "125px" }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.rate}
                    onChange={(event) =>
                      updateApprovalRate(
                        item.measurementId,
                        event.target.value
                      )
                    }
                    disabled={savingApproval}
                    placeholder="Enter rate"
                    style={{
                      ...styles.input,
                      minWidth: "110px",
                    }}
                  />
                </td>

                <td style={styles.td}>
                  ₹
                  {money(
                    item.rate !== "" &&
                      Number.isFinite(Number(item.rate)) &&
                      Number(item.rate) >= 0
                      ? item.quantity * Number(item.rate)
                      : 0
                  )}
                </td>

                <td style={styles.td}>
                  <span
                    style={{
                      color:
                        item.status === "Approved"
                          ? "#4ade80"
                          : item.status === "Revision Required"
                            ? "#f87171"
                            : "#fbbf24",
                      fontWeight: 600,
                    }}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}

            {approvalItems.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{ ...styles.td, textAlign: "center" }}
                >
                  No linked measurements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "18px",
          padding: "15px",
          borderRadius: "8px",
          background: "#111827",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: "#9ca3af", fontSize: "13px" }}>
            Total Calculated Amount
          </div>

          <strong style={{ fontSize: "20px", color: "#4ade80" }}>
            ₹
            {money(
              approvalItems.reduce(
                (sum, item) =>
                  sum +
                  (item.rate !== "" &&
                  Number.isFinite(Number(item.rate)) &&
                  Number(item.rate) >= 0
                    ? item.quantity * Number(item.rate)
                    : 0),
                0
              )
            )}
          </strong>
        </div>

        <button
          type="button"
          style={{
            ...styles.button,
            background: "#047857",
            opacity:
              savingApproval || approvalItems.length === 0 ? 0.6 : 1,
          }}
          disabled={savingApproval || approvalItems.length === 0}
          onClick={saveRateApprovals}
        >
          {savingApproval ? "Approving..." : "✓ Save & Approve Rates"}
        </button>
      </div>
    </div>
  </div>
)}

      <section style={styles.panel}>
        <h3 style={{ marginTop: 0 }}>3. Work Order History</h3>

        <div style={styles.grid}>

          <div>
            <label style={styles.label}>Filter by Category</label>
            <select style={styles.input} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {[...new Set(orders.map((order) => order.category))].filter(Boolean).sort().map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Filter by Site</label>
            <select style={styles.input} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
              <option value="All">All Sites</option>
              {[...new Set(orders.map((order) => order.site))].filter(Boolean).sort().map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "end" }}>
            <button type="button" style={{ ...styles.button, width: "100%" }} onClick={loadOrders} disabled={loadingOrders}>
              {loadingOrders ? "Refreshing..." : "Refresh History"}
            </button>
          </div>
        </div>

        <div style={{ ...styles.tableWrap, marginTop: "18px" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                          {[
              "Order No.",
              "Vendor",
              "Category",
              "Subcategory",
              "Site",
              "Description",
              "Measurement Type",
              "Rate Approval",
              "Start Date",
              "Deadline",
              "Action",
            ].map((heading) => (
              <th key={heading} style={styles.th}>
                {heading}
              </th>
            ))}
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td style={styles.td}>{order.orderNumber || "—"}</td>
                  <td style={styles.td}>{order.vendorName || "—"}</td>
                  <td style={styles.td}>{order.category || "—"}</td>
                  <td style={styles.td}>{order.subcategory || "—"}</td>
                  <td style={styles.td}>{order.site || "—"}</td>
                  <td style={styles.td}>{order.workDescription || "—"}</td>
                  <td style={styles.td}>{order.measurementType || "—"}</td>
                  <td style={styles.td}>
                  {(() => {
                   const status = getRateApprovalStatus(order);
                      const measurementType = String(
                        order.measurementType || ""
                      ).toLowerCase();

                      const vendorInfo =
                        order.vendorId && typeof order.vendorId === "object"
                          ? order.vendorId
                          : {};

                      const vendorType = String(
                        order.vendorType || vendorInfo.vendorType || ""
                      ).toLowerCase();

                      if (vendorType === "work" && measurementType === "fixed") {
                        return (
                          <span style={{ color: "#4ade80", fontWeight: 700 }}>
                            Fixed Rate Saved
                          </span>
                        );
                      }

                      if (status === "Not Required") {
                        return <span style={{ color: "#9ca3af" }}>Not Required</span>;
                      }

                    const approved = status === "Approved";

                    return (
                      <div style={{ minWidth: "150px" }}>
                        <div
                          style={{
                            color: approved ? "#4ade80" : "#fbbf24",
                            fontWeight: 700,
                            marginBottom: "8px",
                          }}
                        >
                          {status}
                        </div>

                        <button
                          type="button"
                          onClick={() => openRateApproval(order)}
                          style={{
                            ...styles.button,
                            background: approved ? "#047857" : "#d97706",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {approved ? "View / Update Rates" : "Approve Rates"}
                        </button>
                      </div>
                    );
                  })()}
                </td>
                  <td style={styles.td}>
                    {order.startDate ? new Date(order.startDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td style={styles.td}>
                    {order.deadline ? new Date(order.deadline).toLocaleDateString("en-IN") : "—"}
                  </td>                  
                  <td style={styles.td}> <div style={{ display: "flex",flexDirection: "column",gap: "8px",
                      minWidth: "125px",}}
                  >
                  <button type="button" onClick={() => downloadWorkOrderPDF(order)}
                    style={{
                      ...styles.button,
                      background: "#7c3aed",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📄 Download PDF
                  </button>
                    <button
                    type="button"
                    onClick={() => openBillModal(order)}
                    style={{
                      ...styles.button,
                      background: "#047857",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₹ Generate Bill
                  </button>
                  <button type="button" onClick={() => deleteOrder(order._id)}
                    style={{
                      ...styles.button,
                      background: "#dc2626",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
                </td>

                </tr>
              ))}

              {!loadingOrders && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={16} style={{ ...styles.td, textAlign: "center", color: "#9ca3af" }}>
                    No Work Orders found.
                  </td>
                </tr>
              )}

              {loadingOrders && (
                <tr>
                  <td colSpan={16} style={{ ...styles.td, textAlign: "center" }}>
                    Loading Work Orders...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {billOrder && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 100001,
      background: "rgba(0,0,0,0.82)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "1000px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#1f2937",
        color: "#e5e7eb",
        border: "1px solid #4b5563",
        borderRadius: "12px",
        padding: "22px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div>
  <h3 style={{ marginTop: 0 }}>Work Order Billing</h3>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "8px 50px",
      alignItems: "center",
    }}
  >
    <span>Order: {billOrder.orderNumber || "—"}</span>
    <span>Vendor: {billOrder.vendorName || "—"}</span>
    <span>Site: {billOrder.site || "—"}</span>
  </div>
</div>

        <button
          type="button"
          style={{ ...styles.button, background: "#dc2626" }}
          onClick={() => setBillOrder(null)}
        >
          Close ✕
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <label style={styles.label}>Approved Work Amount</label>
          <strong>₹{money(billSummary.approvedAmount)}</strong>
        </div>
        <div style={styles.panel}>
          <label style={styles.label}>Total Paid</label>
          <strong>₹{money(billSummary.totalPaid)}</strong>
        </div>
        <div style={styles.panel}>
          <label style={styles.label}>Total Balance</label>
          <strong>₹{money(billSummary.outstanding)}</strong>
        </div>
      </div>

      <h4>Create Payment Bill</h4>

      <form onSubmit={createPaymentBill}>
        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Payment Amount (₹) *</label>
            <input
              style={styles.input}
              type="number"
              min="0.01"
              step="0.01"
              value={billForm.paymentAmount}
              onChange={(event) =>
                setBillForm((previous) => ({
                  ...previous,
                  paymentAmount: event.target.value,
                }))
              }
              required
            />
          </div>


<div>
  <label style={styles.label}>Payment Mode *</label>

  <select
    style={styles.input}
    value={billForm.paymentMode}
    onChange={(event) => {
      const selectedMode = event.target.value;

      setBillForm((previous) => ({
        ...previous,
        paymentMode: selectedMode,
      }));

      setPaymentProof(null);
    }}
    required
  >
    <option value="Cash">Cash</option>
    <option value="UPI / Online">UPI / Online</option>
  </select>
</div>

{billForm.paymentMode === "UPI / Online" && (
  <div>
    <label style={styles.label}>
      Payment Proof Image *
    </label>

    <input
      style={styles.input}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      capture="environment"
      required
      onChange={(event) => {
        const file = event.target.files?.[0] || null;
        setPaymentProof(file);
      }}
    />

    {/* <p
      style={{
        color: "#9ca3af",
        fontSize: "12px",
        marginTop: "6px",
      }}
    >
      Upload payment screenshot or receipt.
      JPG, PNG or WEBP, maximum 5 MB.
    </p> */}

    {paymentProof && (
      <div style={{ marginTop: "8px" }}>
        <span
          style={{
            fontSize: "13px",
            overflowWrap: "anywhere",
          }}
        >
          Selected: {paymentProof.name}
        </span>

        <button
          type="button"
          onClick={() => {
            setPaymentProof(null);
          }}
          style={{
            ...styles.button,
            background: "#dc2626",
            marginLeft: "8px",
            padding: "5px 10px",
          }}
        >
          Remove
        </button>
      </div>
    )}
  </div>
)}



          <div>
            <label style={styles.label}>Payment Date *</label>
            <input
              style={styles.input}
              type="date"
              value={billForm.paymentDate}
              onChange={(event) =>
                setBillForm((previous) => ({
                  ...previous,
                  paymentDate: event.target.value,
                }))
              }
              required
            />
          </div>
          <div>
            <label style={styles.label}>Remarks</label>
            <input
              style={styles.input}
              value={billForm.remarks}
              onChange={(event) =>
                setBillForm((previous) => ({
                  ...previous,
                  remarks: event.target.value,
                }))
              }
              placeholder="Optional payment notes"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingBill || loadingBills}
          style={{
            ...styles.button,
            marginTop: "16px",
            background: "#047857",
            opacity: savingBill || loadingBills ? 0.6 : 1,
          }}
        >
          {savingBill ? "Creating Bill..." : "Create Bill & Payment PDF"}
        </button>
      </form>

      <h4 style={{ marginTop: "28px" }}>Payment History</h4>

      {loadingBills ? (
        <p>Loading payment history...</p>
      ) : billHistory.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No payments recorded yet.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={{ ...styles.table, minWidth: "750px" }}>
            <thead>
              <tr>
                {[
                  "Bill No.",
                  "Date",
                  "Payment Mode",
                  "Previously Paid",
                  "This Payment",
                  "Balance After",
                  "Payment Proof",
                  "PDF",
                ].map((heading) => (
                  <th key={heading} style={styles.th}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {billHistory.map((bill) => (
                <tr key={bill._id}>
                  <td style={styles.td}>{bill.billNumber}</td>
                  <td style={styles.td}>
                    {bill.paymentDate
                      ? new Date(bill.paymentDate).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td style={styles.td}>{bill.paymentMode}</td>
                  <td style={styles.td}>₹{money(bill.previouslyPaid)}</td>
                  <td style={styles.td}>₹{money(bill.paymentAmount)}</td>
                  <td style={styles.td}>₹{money(bill.balanceAfter)}</td>
                  <td style={styles.td}>
                    {bill.paymentMode === "UPI / Online" && bill.paymentProofUrl ? (
                      <a href={bill.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: "#60a5fa" }}> View Payment Image
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={styles.td}>
                    <button type="button" style={{ ...styles.button, background: "#7c3aed" }}
                      onClick={() => downloadPaymentBillPDF(bill)}
                    > Download / Share</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}
