import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-development-secret";
const DB_FILE = path.join(__dirname, "data.json");

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: [], tasks: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanName) return res.status(400).json({ message: "Name is required." });
  if (!validateEmail(cleanEmail)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const db = loadDb();
  if (db.users.some(u => u.email === cleanEmail)) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDb(db);

  const token = makeToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!validateEmail(cleanEmail) || !password) {
    return res.status(400).json({ message: "Enter a valid email and password." });
  }

  const db = loadDb();
  const user = db.users.find(u => u.email === cleanEmail);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  const token = makeToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get("/api/auth/me", auth, (req, res) => {
  const db = loadDb();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ message: "User not found." });

  res.json({
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get("/api/tasks", auth, (req, res) => {
  const db = loadDb();
  const tasks = db.tasks.filter(t => t.ownerId === req.user.id);
  res.json({ tasks });
});

app.post("/api/tasks", auth, (req, res) => {
  const { title, description = "", status = "Todo", priority = "Medium", dueDate = "" } = req.body;

  if (!String(title || "").trim()) {
    return res.status(400).json({ message: "Task title is required." });
  }

  const db = loadDb();
  const task = {
    id: crypto.randomUUID(),
    ownerId: req.user.id,
    title: String(title).trim(),
    description: String(description).trim(),
    status,
    priority,
    dueDate,
    createdAt: new Date().toISOString()
  };

  db.tasks.unshift(task);
  saveDb(db);
  res.status(201).json({ task });
});

app.patch("/api/tasks/:id", auth, (req, res) => {
  const db = loadDb();
  const task = db.tasks.find(t => t.id === req.params.id && t.ownerId === req.user.id);

  if (!task) return res.status(404).json({ message: "Task not found." });

  const allowed = ["title", "description", "status", "priority", "dueDate"];
  for (const key of allowed) {
    if (key in req.body) task[key] = req.body[key];
  }

  saveDb(db);
  res.json({ task });
});

app.delete("/api/tasks/:id", auth, (req, res) => {
  const db = loadDb();
  const before = db.tasks.length;
  db.tasks = db.tasks.filter(t => !(t.id === req.params.id && t.ownerId === req.user.id));

  if (db.tasks.length === before) {
    return res.status(404).json({ message: "Task not found." });
  }

  saveDb(db);
  res.json({ message: "Task deleted." });
});

app.listen(PORT, () => {
  console.log(`Task Management API running at http://localhost:${PORT}`);
});