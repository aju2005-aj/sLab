# Smart Laboratory Equipment Fault Management System

A full-stack, responsive web application for managing laboratory equipment faults, designed to run locally on a network (LAN/Wi-Fi).

## Prerequisites
- Node.js (v18+)

## Installation & Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Configure PostgreSQL with `DATABASE_URL` (or the `PG*` variables) in `backend/.env`. The required tables and demo data are created on first run.

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

Double-click the `start.bat` file in the root folder. This will open two command prompt windows, one for the backend (API & Socket.io) and one for the frontend (Next.js).

### Accessing Locally
Open your browser and navigate to: `http://localhost:3000`

### Accessing from Mobile/LAN
1. Open Command Prompt and type `ipconfig`.
2. Look for your `IPv4 Address` under your Wi-Fi or Ethernet adapter (e.g., `192.168.1.5`).
3. On any phone or PC connected to the **same Wi-Fi router**, open a browser and go to `http://YOUR_IP_ADDRESS:3000` (e.g., `http://192.168.1.5:3000`).
4. Both the Next.js frontend and the Express backend are configured to bind to `0.0.0.0`, allowing external network access. The frontend automatically determines the API host dynamically.

## Demo Accounts
- **Admin**: admin@example.com / admin123
- **Technician**: tech@example.com / tech123
- **Student/Staff**: user@example.com / user123

## Features Included
- ✅ PostgreSQL database auto-initialization
- ✅ Real-time updates using Socket.IO
- ✅ AI-lite keyword-based fix suggestions
- ✅ QR Code generation for equipment
- ✅ Responsive Dark/Light UI (Tailwind CSS)
- ✅ Role-based authentication (Admin/Tech/User)
