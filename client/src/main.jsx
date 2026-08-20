import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { BarChart3, CheckCircle2, ClipboardList, LogOut, Plus, Trash2, UserRound } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "./styles.css";

const API = "http://localhost:5000/api";
const api = axios.create({ baseURL: API });

function setAuth(token) {
  if (token) {
    localStorage.setItem("task_token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("task_token");
    delete api.defaults.headers.common.Authorization;
  }
}

const savedToken = localStorage.getItem("task_token");
if (savedToken) setAuth(savedToken);

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError("Please enter a valid email address.");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (mode === "signup" && !form.name.trim()) {
      return setError("Please enter your name.");
    }

    setBusy(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const { data } = await api.post(endpoint, form);
      setAuth(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to continue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="brand-mark">TM</div>
        <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="muted">
          {mode === "login" ? "Sign in to manage your work." : "Create your account to get started."}
        </p>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>Name<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
          )}
          <label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" /></label>
          <label>Password<input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Minimum 6 characters" /></label>
          {error && <div className="error">{error}</div>}
          <button className="primary full" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>

        <button className="link-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "Todo", priority: "Medium", dueDate: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const me = await api.get("/auth/me");
      setUser(me.data.user);
      const taskResponse = await api.get("/tasks");
      setTasks(taskResponse.data.tasks);
    } catch {
      setAuth(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="center">Loading...</div>;
  if (!user) return <AuthPage onLogin={load} />;

  const addTask = async e => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    const { data } = await api.post("/tasks", newTask);
    setTasks([data.task, ...tasks]);
    setNewTask({ title: "", description: "", status: "Todo", priority: "Medium", dueDate: "" });
    setShowForm(false);
  };

  const updateTask = async (id, patch) => {
    const { data } = await api.patch(`/tasks/${id}`, patch);
    setTasks(tasks.map(t => t.id === id ? data.task : t));
  };

  const deleteTask = async id => {
    await api.delete(`/tasks/${id}`);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const logout = () => {
    setAuth(null);
    setUser(null);
    setTasks([]);
  };

  const counts = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === "Todo").length,
    progress: tasks.filter(t => t.status === "In Progress").length,
    done: tasks.filter(t => t.status === "Completed").length
  }), [tasks]);

  const statusData = [
    { name: "Todo", value: counts.todo },
    { name: "In Progress", value: counts.progress },
    { name: "Completed", value: counts.done }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><span>TM</span> Task Manager</div>
        <nav>
          {[
            ["dashboard", "Dashboard", BarChart3],
            ["tasks", "Tasks", ClipboardList],
            ["analytics", "Analytics", BarChart3]
          ].map(([id, label, Icon]) => (
            <button key={id} className={view === id ? "nav active" : "nav"} onClick={() => setView(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-mini"><UserRound size={18}/><div><b>{user.name}</b><small>{user.email}</small></div></div>
          <button className="nav" onClick={logout}><LogOut size={18}/> Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>{view === "dashboard" ? "Dashboard" : view === "tasks" ? "Tasks" : "Analytics"}</h1>
            <p className="muted">Signed in as {user.name}</p>
          </div>
          <button className="primary" onClick={() => setShowForm(true)}><Plus size={17}/> New task</button>
        </header>

        {view === "dashboard" && (
          <>
            <section className="stats">
              <div className="stat"><span>Total tasks</span><strong>{counts.total}</strong></div>
              <div className="stat"><span>To do</span><strong>{counts.todo}</strong></div>
              <div className="stat"><span>In progress</span><strong>{counts.progress}</strong></div>
              <div className="stat"><span>Completed</span><strong>{counts.done}</strong></div>
            </section>
            <section className="content-grid">
              <div className="panel">
                <div className="panel-head"><h2>Recent tasks</h2><button className="link-button" onClick={() => setView("tasks")}>View all</button></div>
                <TaskList tasks={tasks.slice(0, 6)} updateTask={updateTask} deleteTask={deleteTask}/>
              </div>
              <div className="panel chart-panel">
                <h2>Status</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                    {statusData.map((_, i) => <Cell key={i} />)}
                  </Pie><Tooltip/><Legend/></PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {view === "tasks" && (
          <div className="panel">
            <div className="panel-head"><h2>All tasks</h2><span className="muted">{tasks.length} tasks</span></div>
            <TaskList tasks={tasks} updateTask={updateTask} deleteTask={deleteTask}/>
          </div>
        )}

        {view === "analytics" && (
          <div className="content-grid">
            <div className="panel chart-panel"><h2>Tasks by status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="panel chart-panel"><h2>Priority</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={["Low","Medium","High"].map(p => ({name:p,value:tasks.filter(t=>t.priority===p).length}))}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value"/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <form className="modal" onSubmit={addTask} onMouseDown={e => e.stopPropagation()}>
            <h2>New task</h2>
            <label>Title<input autoFocus value={newTask.title} onChange={e => setNewTask({...newTask,title:e.target.value})}/></label>
            <label>Description<textarea value={newTask.description} onChange={e => setNewTask({...newTask,description:e.target.value})}/></label>
            <div className="form-row">
              <label>Status<select value={newTask.status} onChange={e=>setNewTask({...newTask,status:e.target.value})}><option>Todo</option><option>In Progress</option><option>Completed</option></select></label>
              <label>Priority<select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label>
            </div>
            <label>Due date<input type="date" value={newTask.dueDate} onChange={e=>setNewTask({...newTask,dueDate:e.target.value})}/></label>
            <div className="modal-actions"><button type="button" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary">Create task</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function TaskList({ tasks, updateTask, deleteTask }) {
  if (!tasks.length) return <div className="empty">No tasks yet.</div>;
  return <div className="task-list">{tasks.map(task => (
    <div className="task-row" key={task.id}>
      <div className="task-main">
        <strong>{task.title}</strong>
        {task.description && <p>{task.description}</p>}
        <small>{task.dueDate ? `Due ${task.dueDate}` : "No due date"}</small>
      </div>
      <select value={task.status} onChange={e=>updateTask(task.id,{status:e.target.value})}>
        <option>Todo</option><option>In Progress</option><option>Completed</option>
      </select>
      <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
      <button className="icon-btn" onClick={()=>deleteTask(task.id)} title="Delete"><Trash2 size={17}/></button>
    </div>
  ))}</div>;
}

createRoot(document.getElementById("root")).render(<App />);
