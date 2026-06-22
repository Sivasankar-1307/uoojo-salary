# Delivery Salary Management System (Uoojo Delivery Partner)

A full-stack responsive web application designed for food delivery partners to record and analyze delivery earnings.

## Tech Stack

- **Frontend**: React.js (Vite), React Router DOM, Axios, Chart.js, Lucide Icons, Vanilla Responsive CSS
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs
- **Database**: SQLite (`database.db`)

---

## Features Implemented

1. **Secure Authentication**: signup/signin using hashed passwords and JWT tokens.
2. **Order Management CRUD**: add, view, search, edit, and delete delivery records.
3. **Delivery Analysis**: includes the custom field **Order Type** (Normal Delivery, Long Distance, Bonus Delivery) to track what delivery types are most profitable.
4. **Calculations**: auto-calculated Grand Total = Salary + Allowance in cards and forms.
5. **CSV Exporter & Monthly Reports**: download filtered data sheets or quickly isolate and download current monthly summaries.
6. **Detailed Analytics**: line graphs for daily income trends, stacked bar charts for monthly breakdowns, and revenue distribution pie charts.
7. **Premium Responsive Theme**: collapsible glassmorphic sidebar, Toast notifications, and a light/dark mode switcher.
8. **Dev Stability**: configured nodemon ignores for database locks and resolved React Router v6 console warning spams.

---

## How to Get Started

Follow these steps to launch the application:

### 1. Install Dependencies
Run this in the root workspace folder to install all package modules for both the frontend and backend in one command:
```powershell
npm run install:all
```

### 2. Start the Development Servers
Launch both the Express backend and Vite frontend dev servers concurrently:
```powershell
npm run dev
```

- **Frontend client**: [http://localhost:5173](http://localhost:5173)
- **Backend server**: [http://localhost:5000](http://localhost:5000)

### 3. Log In / Sign Up
- Click **Register Here** on the login screen to sign up a new rider account.
- Log in to begin entering and analyzing your delivery runs!
