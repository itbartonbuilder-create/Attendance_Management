import React, { useEffect, useState } from "react";
import axios from "axios";

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    site: "",
    type: "",
    assignedTo: "",
    title: "",
    description: "",
    deadline: "",
  });

  const SITES = ["Bangalore", "Japuriya", "Vashali", "Faridabad"];
  const TYPES = ["Manager", "Worker"];

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchTasks = () => {
    let url = "https://attendance-management-backend-vh2w.onrender.com/api/tasks";
    if (user.role !== "admin") url += `?assignedTo=${user._id}`;
    axios.get(url).then((res) => setTasks(res.data));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (form.site && form.type) {
      const endpoint =
        form.type === "Manager"
          ? "https://attendance-management-backend-vh2w.onrender.com/api/managers"
          : "https://attendance-management-backend-vh2w.onrender.com/api/workers";

      axios.get(`${endpoint}?site=${form.site}`).then((res) => setPeople(res.data));
    }
  }, [form.site, form.type]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      axios
        .put(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/${editingId}`, form)
        .then(() => {
          setEditingId(null);
          fetchTasks();
          resetForm();
        });
    } else {
      axios
        .post("https://attendance-management-backend-vh2w.onrender.com/api/tasks/create", form)
        .then(() => {
          fetchTasks();
          resetForm();
        });
    }
  };

  const resetForm = () => {
    setForm({ site: "", type: "", assignedTo: "", title: "", description: "", deadline: "" });
  };

  const handleDelete = (id) => {
    axios.delete(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/${id}`).then(() => fetchTasks());
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

  const updateRemark = (taskId, remark, reason) => {
    axios
      .put(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/remark/${taskId}`, {
        remark,
        reason,
        userId: user._id,
      })
      .then(() => fetchTasks())
      .catch((err) => alert(err.response.data.message));
  };

  const acceptRemark = (taskId) => {
    // Accept → no reason prompt
    axios
      .put(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/remark/accept/${taskId}`, { adminReason: "" })
      .then(() => fetchTasks());
  };

  const rejectRemark = (taskId) => {
    // Reject → reason required
    const reason = prompt("Why rejecting? (required):");
    if (!reason) return alert("Reject reason is required!");
    axios
      .put(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/remark/reject/${taskId}`, { adminReason: reason })
      .then(() => fetchTasks());
  };

  return (
    <div className="task-container">
      <h2 className="task-title">{editingId ? "Edit Task" : "Assign Task"}</h2>

      {user.role === "admin" && (
        <form className="task-box" onSubmit={handleSubmit}>
          <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} required>
            <option value="" disabled>
              Select Site
            </option>
            {SITES.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

          {form.site && (
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
              <option value="" disabled>
                Select Type
              </option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {form.type && (
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
              <option value="" disabled>
                Select {form.type}
              </option>
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
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Task Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          ></textarea>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
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
              <th>Deadline</th>
              <th>Remark</th>
              {user.role === "admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={user.role === "admin" ? 7 : 6} style={{ textAlign: "center" }}>
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
                  <td>{t.deadline}</td>
                  <td>
                    {user.role !== "admin" ? (
                      t.remarkStatus === "Pending" ? (
                        <div>
                          <select value={t.remark || ""} onChange={(e) => updateRemark(t._id, e.target.value, t.reason)}>
                            <option value="">Select</option>
                            <option value="Completed">Completed</option>
                            <option value="Not Completed">Not Completed</option>
                            <option value="Delay">Delay</option>
                          </select>

                          {(t.remark === "Not Completed" || t.remark === "Delay") && (
                            <input
                              type="text"
                              placeholder="Reason"
                              value={t.reason || ""}
                              onChange={(e) => updateRemark(t._id, t.remark, e.target.value)}
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          <strong>Remark:</strong> {t.remark} <br />
                          {t.reason && <span>Reason: {t.reason}</span>} <br />
                          <em>Admin {t.remarkStatus.toLowerCase()}</em>
                        </div>
                      )
                    ) : (
                      <div>
                        <strong>Remark: {t.remark || "-"}</strong>
                        {t.reason && <p>Reason: {t.reason}</p>}
                        {t.remarkBy && <p>Given By: {t.remarkBy?.name}</p>}
                        <p>Status: {t.remarkStatus}</p>
                        {t.adminRejectReason && <p><strong>Admin Note:</strong> {t.adminRejectReason}</p>}

                        {t.remark && t.remarkStatus === "Pending" && (
                          <>
                            <button onClick={() => acceptRemark(t._id)} className="edit-btn">Accept</button>
                            <button onClick={() => rejectRemark(t._id)} className="delete-btn">Reject</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {user.role === "admin" && t.remarkStatus === "Pending" && (
                    <td>
                      <button onClick={() => handleEdit(t)} className="edit-btn">Edit</button>
                      <button onClick={() => handleDelete(t._id)} className="delete-btn">Delete</button>
                    </td>
                  )}
                  {user.role === "admin" && t.remarkStatus !== "Pending" && <td>—</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskPage;
