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

  // Load tasks
  const fetchTasks = () => {
    axios
      .get("https://attendance-management-backend-vh2w.onrender.com/api/tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => console.log("Error:", err));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Load managers/workers based on site & type
  useEffect(() => {
    if (form.site && form.type) {
      const endpoint =
        form.type === "Manager"
          ? "https://attendance-management-backend-vh2w.onrender.com/api/managers"
          : "https://attendance-management-backend-vh2w.onrender.com/api/workers";

      axios
        .get(`${endpoint}?site=${form.site}`)
        .then((res) => setPeople(res.data))
        .catch((err) => console.log(err));
    }
  }, [form.site, form.type]);

  // Submit Task (Create or Update)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      // UPDATE TASK
      axios
        .put(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/${editingId}`, form)
        .then(() => {
          alert("Task Updated");
          setEditingId(null);
          fetchTasks();
          resetForm();
        })
        .catch((err) => console.log(err));
    } else {
      // CREATE NEW TASK
      axios
        .post("https://attendance-management-backend-vh2w.onrender.com/api/tasks/create", form)
        .then(() => {
          alert("Task Assigned");
          fetchTasks();
          resetForm();
        })
        .catch((err) => console.log(err));
    }
  };

  const resetForm = () => {
    setForm({
      site: "",
      type: "",
      assignedTo: "",
      title: "",
      description: "",
      deadline: "",
    });
  };

  // DELETE TASK
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    axios
      .delete(`https://attendance-management-backend-vh2w.onrender.com/api/tasks/${id}`)
      .then(() => {
        alert("Task Deleted");
        fetchTasks();
      })
      .catch((err) => console.log(err));
  };

  // EDIT TASK (Load data in form)
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

  return (
    <div className="task-container">
      <h2 className="task-title">{editingId ? "Edit Task" : "Assign Task"}</h2>

      <form className="task-box" onSubmit={handleSubmit}>
        <select
          value={form.site}
          onChange={(e) => setForm({ ...form, site: e.target.value })}
          required
        >
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
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          >
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
          <select
            value={form.assignedTo}
            onChange={(e) =>
              setForm({ ...form, assignedTo: e.target.value })
            }
            required
          >
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

        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          required
        />

        <button type="submit" className="btn-view">
          {editingId ? "Update Task" : "Assign Task"}
        </button>
      </form>

      {/* <h2 className="task-title">All Tasks</h2> */}

      <div className="task-box">
        <table className="task-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Name</th>
              <th>Task</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((t) => (
              <tr key={t._id}>
                <td>{t.site}</td>
                <td>{t.assignedTo?.name}</td>
                <td>{t.title}</td>
                <td>{t.deadline}</td>
                <td>{t.status}</td>

                <td>
                  <button
                    onClick={() => handleEdit(t)}
                    className="edit-btn"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(t._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskPage;


