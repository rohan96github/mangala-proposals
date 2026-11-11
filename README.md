# 💍 Mangala Proposals — Sri Lankan Matrimony Platform

A modern, full-stack trilingual (Sinhala, Tamil, English) matrimony platform built with **React (Vite)**, **Node.js (Express)**, and **MySQL**.

---

## ✨ Features

- **🌐 Trilingual Support:** Seamless switching between Sinhala, Tamil, and English.
- **🎬 Cinematic Video Background:** Auto-cycling background wedding videos with smooth opacity controls.
- **👰 Groom & Bride Search:** Filter by district, religion, caste, age, and marital status.
- **⚙️ Administrator Dashboard:**
  - Review, approve, reject, or hide profiles.
  - User management & password reset.
  - **📥 19-Field XLSX Bulk Profile Import:** Upload entire batches of proposals via Excel with one click.
  - **📄 Download Official Excel Template:** Pre-built 19-column spreadsheet with sample data.
- **🔒 Privacy & Safety:** Contact details remain shielded until a proposal interest is mutually accepted.

---

## 🚀 How to Run Locally (Local Setup)

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL Server** (e.g. via WAMP, XAMPP, or standalone MySQL80)

### 2. Database Setup
1. Open your MySQL client (MySQL Workbench, phpMyAdmin, etc.).
2. Run `database/schema.sql` to create `mangala_db` and tables.
3. Run `database/seed.sql` to populate districts and the default administrator account.

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/` (or copy from `.env.example`):
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourMySQLPassword
DB_NAME=mangala_db
JWT_SECRET=mangala_super_secret_jwt_key_2024
CLIENT_URL=http://localhost:5173
```
Start the backend server:
```bash
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔐 Default Admin Credentials

- **URL:** `http://localhost:5173/admin/login`
- **Username / Email:** `admin@youremail.com` (or `root`)
- **Password:** `Rohan@123`
