# Task Management System

A full-stack task management application built using React and Node.js/Express. The application provides user authentication, task management, basic collaboration support, and task analytics.

## Features

### Authentication
- User Sign Up
- User Login
- JWT-based authentication
- Password hashing using bcryptjs
- Email and password validation
- Protected API routes
- Logout

### Task Management
- Create tasks
- View tasks
- Update task status
- Set task priority
- Add task descriptions
- Set due dates
- Delete tasks

### Collaboration
- Tasks are associated with authenticated users
- User-specific task management
- Task ownership through the authenticated user
- Architecture can be extended to support task assignment and team members

### Analytics
- Total task count
- To Do tasks
- In Progress tasks
- Completed tasks
- Tasks by status chart
- Tasks by priority chart

## Technology Stack

### Frontend
- React
- Vite
- Axios
- Recharts
- Lucide React
- CSS

### Backend
- Node.js
- Express.js
- JWT
- bcryptjs
- CORS

### Storage
- JSON-based storage for the development version

---

# Project Structure

```text
Task-Management-System/
│
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── server.js
│   ├── package.json
│   └── data.json
│
├── .gitignore
└── README.md
