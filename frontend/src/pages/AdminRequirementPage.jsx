import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function AdminRequirementPage() {
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const selectedSite =
    params.get("site") || "";

  const selectedDate =
    params.get("date") || "";

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequirements = async () => {
    if (!selectedSite) {
      setRequirements([]);
      return;
    }

    setLoading(true);

    try {
      const url =
        `https://attendance-management-backend-vh2w.onrender.com/api/requirements` +
        `?site=${encodeURIComponent(selectedSite)}`;

      console.log(
        "Fetching requirements for site:",
        selectedSite
      );

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(
          "Failed to fetch requirements"
        );
      }

      const data = await res.json();

      console.log(
        "Requirement response:",
        data
      );

      setRequirements(
        data.data || []
      );

    } catch (error) {
      console.error(
        "Requirement fetch error:",
        error
      );

      alert(
        "❌ Failed to load requirements"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRequirements();
  }, [selectedSite]);


  const deleteRequirement = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this requirement?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `https://attendance-management-backend-vh2w.onrender.com/api/requirements/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Delete failed"
        );
      }

      alert(
        "✅ Requirement deleted successfully"
      );

      fetchRequirements();

    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      alert(
        "❌ Failed to delete requirement"
      );
    }
  };

  const downloadPDF = (requirement) => {
    try {
      const doc =
        new jsPDF("landscape");

      doc.setFontSize(18);
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "Material Requirement Report",
        14,
        18
      );

      doc.setFontSize(11);
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        `Site: ${
          requirement.site || "-"
        }`,
        14,
        27
      );

      doc.text(
        `Requirement Date: ${
          requirement.date
            ? new Date(
                requirement.date
              ).toLocaleDateString(
                "en-GB"
              )
            : "-"
        }`,
        14,
        34
      );

      const tableData = [
        [
          requirement.date
            ? new Date(
                requirement.date
              ).toLocaleDateString(
                "en-GB"
              )
            : "-",

          requirement.category ||
            "-",

          requirement.material ||
            "-",

          `${requirement.quantity || 0} ${
            requirement.unit || ""
          }`,

          requirement.priority ||
            "Normal",

          requirement.purpose ||
            "-",
        ],
      ];

      autoTable(doc, {
        startY: 42,

        head: [
          [
            "Date",
            "Category",
            "Material",
            "Required",
            "Priority",
            "Purpose / Work",
          ],
        ],

        body: tableData,

        theme: "grid",

        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: "middle",
          overflow: "linebreak",
        },

        headStyles: {
          fontStyle: "bold",
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 30,
            halign: "center",
          },

          1: {
            cellWidth: 35,
          },

          2: {
            cellWidth: 55,
          },

          3: {
            cellWidth: 35,
            halign: "center",
          },

          4: {
            cellWidth: 30,
            halign: "center",
          },

          5: {
            cellWidth: 85,
          },
        },
      });

      const safeSite =
        (
          requirement.site ||
          "Site"
        ).replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

      const safeMaterial =
        (
          requirement.material ||
          "Material"
        ).replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

      const fileName =
        `Requirement_${safeSite}_${safeMaterial}.pdf`;

      doc.save(fileName);

    } catch (error) {
      console.error(
        "PDF error:",
        error
      );

      alert(
        "❌ PDF download nahi ho paya"
      );
    }
  };
  if (!selectedSite) {
    return (
      <div style={containerStyle}>
        <h2>
          📋 Requirement Management
        </h2>

        <div style={messageStyle}>
          Please select a site from
          Work Calendar first.
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>

      <div style={headerStyle}>

        <h2 style={{ margin: 0 }}>
          📋 Requirement Management
          {" — "}
          {selectedSite}
        </h2>

      </div>

      {/* <div style={siteInfoStyle}>
        <strong>
          Selected Site:
        </strong>{" "}
        {selectedSite}

        {selectedDate && (
          <>
            {"  |  "}
            <strong>
              Date:
            </strong>{" "}
            {new Date(
              selectedDate
            ).toLocaleDateString(
              "en-GB"
            )}
          </>
        )}
      </div> */}

      <div style={countStyle}>
        Total Requirements:{" "}
        <strong>
          {requirements.length}
        </strong>
      </div>

      {loading ? (
        <div style={loadingStyle}>
          Loading requirements...
        </div>
      ) : (
        <div style={tableWrapper}>

          <table style={tableStyle}>

            <thead>
              <tr>

                <th style={thStyle}>
                  Date
                </th>

                <th style={thStyle}>
                  Category
                </th>

                <th style={thStyle}>
                  Material
                </th>

                <th style={thStyle}>
                  Required
                </th>

                <th style={thStyle}>
                  Priority
                </th>

                <th style={thStyle}>
                  Purpose / Work
                </th>

                <th style={thStyle}>
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {requirements.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                      padding: 30,
                      color:
                        "#aaa",
                    }}
                  >
                    No requirements found
                    for{" "}
                    <strong>
                      {selectedSite}
                    </strong>
                  </td>

                </tr>

              ) : (

                requirements.map(
                  (r) => (
                    <tr
                      key={r._id}
                    >
                      <td style={tdStyle}>
                        {r.date
                          ? new Date(
                              r.date
                            ).toLocaleDateString(
                              "en-GB"
                            )
                          : "-"}
                      </td>

                      <td style={tdStyle}>
                        {r.category ||
                          "-"}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {r.material ||
                            "-"}
                        </strong>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "center",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {r.quantity ||
                          0}{" "}
                        {r.unit ||
                          ""}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "center",
                        }}
                      >

                        <span
                          style={{
                            ...priorityBadge,

                            background:
                              r.priority ===
                              "High"
                                ? "#c0392b"
                                : r.priority ===
                                  "Medium"
                                ? "#e67e22"
                                : "#3498db",
                          }}
                        >
                          {r.priority ||
                            "Normal"}
                        </span>

                      </td>

                      <td style={tdStyle}>
                        {r.purpose ||
                          "-"}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          whiteSpace:
                            "nowrap",
                        }}
                      >

                        <button
                          onClick={() =>
                            downloadPDF(
                              r
                            )
                          }
                          style={pdfBtn}
                        >
                          📄 PDF
                        </button>

                        <button
                          onClick={() =>
                            deleteRequirement(
                              r._id
                            )
                          }
                          style={deleteBtn}
                        >
                          🗑️ Delete
                        </button>

                      </td>

                    </tr>
                  )
                )

              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default AdminRequirementPage;


const containerStyle = {
  maxWidth: 1400,
  margin: "100px auto",
  padding: 20,
  background: "#2c3e50",
  color: "#fff",
  borderRadius: 8,
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const siteInfoStyle = {
  padding: "12px 15px",
  background: "#34495e",
  borderRadius: 6,
  marginBottom: 15,
};

const countStyle = {
  marginBottom: 15,
  padding: "10px 14px",
  background: "#34495e",
  borderRadius: 6,
};

const loadingStyle = {
  textAlign: "center",
  padding: 40,
  fontSize: 18,
};

const messageStyle = {
  padding: 30,
  textAlign: "center",
  background: "#34495e",
  borderRadius: 8,
  marginTop: 20,
};

const tableWrapper = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse",
  background: "#fff",
  color: "#222",
};

const thStyle = {
  padding: "12px 10px",
  border:
    "1px solid #ddd",
  background: "#34495e",
  color: "#fff",
  textAlign: "left",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  padding: "10px",
  border:
    "1px solid #ddd",
  verticalAlign:
    "middle",
};

const priorityBadge = {
  display:
    "inline-block",
  color: "#fff",
  padding:
    "5px 9px",
  borderRadius: 5,
  fontSize: 12,
  fontWeight:
    "bold",
};

const pdfBtn = {
  padding:
    "6px 10px",
  background:
    "#8e44ad",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor:
    "pointer",
  marginRight: 6,
};

const deleteBtn = {
  padding:
    "6px 10px",
  background:
    "#c0392b",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor:
    "pointer",
};
