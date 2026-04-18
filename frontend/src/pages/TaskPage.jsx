import React, { useEffect, useState } from "react";
import API from "../api";
import { useLocation } from "react-router-dom";
import "../App.css";


const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [tempReason, setTempReason] = useState({});

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const siteFromCalendar = params.get("site");
  const dateFromCalendar = params.get("date");

  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    site: siteFromCalendar || "",
    type: "",
    assignedTo: "",
    title: "",
    description: "",
    deadline: dateFromCalendar || "",
  });

  const TYPES = ["Manager", "Worker"];
  const [reassignTask, setReassignTask] = useState(null);
const [reassignForm, setReassignForm] = useState({
  type: "",
  assignedTo: "",
  deadline: "",
});

  const fetchTasks = () => {
    const siteFilter = siteFromCalendar || user.siteId;

    let url =
      "/tasks";

    if (dateFromCalendar) {
      url += `/by-date/${dateFromCalendar}?site=${siteFilter}`;
    } else {
      url += `?site=${siteFilter}`;
    }

    if (user.role !== "admin") {
      url += `&assignedTo=${user._id}`;
    }

    API.get(url).then((res) => setTasks(res.data));
  };

  useEffect(() => {
    fetchTasks();
  }, [location.search]);

  useEffect(() => {
    const siteToUse = form.site || siteFromCalendar;

    if (!siteToUse || !form.type) {
      setPeople([]);
      return;
    }

    const endpoint =
      form.type === "Manager"
        ? "/managers"
        : "/workers";

   API
      .get(`${endpoint}?site=${siteToUse}`)
      .then((res) => {
        
        const filtered = res.data.filter(
          (p) => p.site === siteToUse
        );
        setPeople(filtered);
      })
      .catch(() => setPeople([]));
  }, [form.site, form.type, siteFromCalendar]);


  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      API
        .put(
          `/tasks/${editingId}`,
          form
        )
        .then(() => {
          setEditingId(null);
          fetchTasks();
          resetForm();
        });
    } else {
      API
        .post(
          "/tasks/create",
          form
        )
        .then(() => {
          fetchTasks();
          resetForm();
        });
    }
  };

  const resetForm = () => {
    setForm({
      site: siteFromCalendar || "",
      type: "",
      assignedTo: "",
      title: "",
      description: "",
      deadline: dateFromCalendar || "",
    });
  };

  const handleDelete = (id) => {
    API
      .delete(
        `/tasks/${id}`
      )
      .then(() => fetchTasks());
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setForm({
      site: task.site,
      type: task.type,
      assignedTo: task.assignedTo?._id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
    });
  };
const handleReassign = (task) => {
  setReassignTask(task);

  setReassignForm({
    type: task.type,
    assignedTo: "",
    deadline: task.deadline,
  });
};
useEffect(() => {
  if (!reassignTask || !reassignForm.type) return;

  const endpoint =
    reassignForm.type === "Manager"
      ? "/managers"
      : "/workers";
API
  .get(`${endpoint}?site=${reassignTask.site}`)
  .then((res) => {
    const filtered = res.data.filter(
      (p) => p.site === reassignTask.site
    );
    setPeople(filtered);
  })
  .catch(() => setPeople([]));
}, [reassignTask, reassignForm.type]);

const submitReassign = () => {
  API
    .put(
      `/tasks/reassign/${reassignTask._id}`,
      {
        newAssignedTo: reassignForm.assignedTo,
        type: reassignForm.type,
        deadline: reassignForm.deadline,
        adminId: user._id,
      }
    )
    .then(() => {
      setReassignTask(null);
      fetchTasks();
    });
};


  return (
    <div className="task-container">
      <h2 className="task-title">
        {editingId ? "Edit Task" : "Assign Task"}
      </h2>

      {user.role === "admin" && (
        <form className="task-box" onSubmit={handleSubmit}>
          <input value={form.site} readOnly />

          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
            required
          >
            <option value="">Select Type</option>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {form.type && (
            <select
              value={form.assignedTo}
              onChange={(e) =>
                setForm({ ...form, assignedTo: e.target.value })
              }
              required
            >
              <option value="">Select Person</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Task Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Task Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            type="date"
            value={form.deadline}
            onChange={(e) =>
              setForm({ ...form, deadline: e.target.value })
            }
            required
          />

          <button type="submit" className="btn-view">
            {editingId ? "Update Task" : "Assign Task"}
          </button>
        </form>
      )}

      <div className="task-box">
        <table className="task-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Name</th>
              <th>Task</th>
              <th>Description</th>
              <th>Assigned Date</th>
              <th>Deadline</th>
              <th>Reassign History</th>
              <th>Status</th>
              {user.role === "admin" && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={user.role === "admin" ? 7 : 6}
                  style={{ textAlign: "center" }}
                >
                  No tasks assigned
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t._id}>
                  <td>{t.site}</td>
                  <td>{t.assignedTo?.name}</td>
                  <td>{t.title}</td>
                  <td>{t.description}</td>
                  <td>
  {t.assignedDate
    ? new Date(t.assignedDate).toLocaleDateString()
    : "-"}
</td>

                  <td>{t.deadline}</td>
                  <td>
  {t.reassignHistory.map((h, i) => (
    <div key={i}>
      {h.assignedTo?.name} — {h.deadline}
    </div>
  ))}
</td>

 <td>

  {user.role !== "admin" ? (
    <select
      value={t.status}
      disabled={t.status !== "Pending"}
      onChange={(e) =>
        API
          .put(
            `/tasks/status/${t._id}`,
            { status: e.target.value }
          )
          .then(fetchTasks)
          .catch((err) =>
            alert(err.response?.data?.message)
          )
      }
      className="status-select"
    >
      <option value="Pending">🕒 Pending</option>
      <option value="Completed">✅ Completed</option>
      <option value="Not Completed">❌ Not Done</option>
    </select>
  ) : (
   
    <>
      <span style={{ fontWeight: "bold" }}>
        {t.status || "Pending"}
      </span>

      {t.statusUpdatedAt && (
        <div style={{ fontSize: 12, color: "#aaa" }}>
          Updated:{" "}
          {new Date(
            t.statusUpdatedAt
          ).toLocaleDateString()}
        </div>
      )}

      {t.completedAt && (
        <div style={{ fontSize: 12, color: "limegreen" }}>
          Done:{" "}
          {new Date(
            t.completedAt
          ).toLocaleDateString()}
        </div>
      )}
    </>
  )}
</td>
                {user.role === "admin" && (
  <td>
   
    {t.status !== "Completed" && (
      <button
        onClick={() => handleReassign(t)}
        className="edit-btn"
        style={{ background: "#6c5ce7", marginRight: 6 }}
      >
        Reassign
      </button>
    )}

  
{t.status === "Pending" && (
  <button
    onClick={() => handleEdit(t)}
    className="edit-btn"
    style={{ marginRight: 6 }}
  >
    Edit
  </button>
)}

   
    <button
      onClick={() => handleDelete(t._id)}
      className="delete-btn"
    >
      Delete
    </button>
  </td>
)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {reassignTask && (
  <div className="modal rreasign">
    <div className="modal-box reassignn">
      <h3>Reassign Task</h3>

      <select
        value={reassignForm.type}
        onChange={(e) =>
          setReassignForm({
            ...reassignForm,
            type: e.target.value,
            assignedTo: "",
          })
        }
      >
        <option value="">Select Type</option>
        <option value="Manager">Manager</option>
        <option value="Worker">Worker</option>
      </select>

      <select
        value={reassignForm.assignedTo}
        onChange={(e) =>
          setReassignForm({
            ...reassignForm,
            assignedTo: e.target.value,
          })
        }
      >
        <option value="">Select Person</option>
        {people.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={reassignForm.deadline}
        onChange={(e) =>
          setReassignForm({
            ...reassignForm,
            deadline: e.target.value,
          })
        }
      />

      <button onClick={submitReassign}>Confirm</button>
      <button onClick={() => setReassignTask(null)}>
        Cancel
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default TaskPage;
