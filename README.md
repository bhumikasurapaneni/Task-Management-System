# Task Management System — React + JWT Authentication

## Features
- User sign up and login
- JWT-based authentication
- Password hashing with bcryptjs
- Email/password validation
- Protected dashboard routes
- Logout
- Task create, update status, delete
- Basic collaboration-ready task ownership
- Dashboard analytics
- React + Vite frontend
- Express backend

## Run

### Backend
```bash
cd server
npm install
npm run dev
```

Backend runs on http://localhost:5000

### Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Demo account
You can create your own account from Sign up. Demo data is created automatically after the first login.

## Important
This is a development/demo authentication implementation. For production, use a real database, HTTPS, secure HttpOnly cookies, refresh-token rotation, rate limiting, email verification, password reset, and server-side audit logging.
