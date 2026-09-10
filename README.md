# Smart Lab Management System

## Overview

Smart Lab Management is a full-stack web application for managing laboratory equipment faults in a smart lab environment. It allows users to report hardware/software issues, upload photos, receive AI-assisted troubleshooting suggestions, track fault status, and view equipment status in a public equipment map.

The system is designed for schools, labs, or technical environments where equipment issues need to be reported quickly and managed by admins and technicians.

---

## Project Purpose

This project solves the following problems:

- Centralized fault reporting for laboratory equipment
- Role-based access for admins, technicians, and regular users
- Real-time updates when new faults are reported or updated
- AI-lite suggestions based on issue descriptions
- QR-based equipment identification and public equipment visibility
- Dashboard-based analytics for lab maintenance monitoring

---

## Main Features

- User authentication with JWT
- Role-based access control:
  - Admin
  - Technician
  - User
- Fault reporting with optional image upload
- AI-assisted fault suggestions based on keywords
- Equipment directory and QR-code-based tracking
- Public equipment map for viewing equipment status
- Dashboard statistics for total faults, pending faults, solved faults, and equipment count
- Real-time notifications using Socket.IO
- SQLite database for local persistence
- Responsive UI built with Next.js and Tailwind CSS

---

## Technology Stack

### Backend
- Node.js
- Express.js
- SQLite3
- JWT (JSON Web Token)
- bcryptjs
- CORS
- Multer (file uploads)
- Socket.IO

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Axios
- Socket.IO Client
- Recharts
- Lucide React
- QRCode React
- html5-qrcode

---

## Project Structure

```text
smart-lab/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── aiController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── equipmentController.js
│   │   └── faultController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── index.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── map/
│   │   │   ├── report/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   ├── package.json
│   └── next.config.mjs
├── database.sqlite
├── start.bat
└── README.md
```

---

## What Each Main File Does

### Root Files
- `start.bat`  
  Windows startup script for launching both backend and frontend.

- `dependecies.md`  
  Contains dependency notes and environment-related setup details.

### Backend Files

#### `backend/server.js`
Main backend entry point.

[create api with crons and route setup and create upload folder, run backend with index '/',create socket,db connect]

Responsibilities:
- Creates the Express app
- Configures CORS(for connect frontend port and backend port) and JSON body parsing
- Serves uploaded image files from the `uploads` folder
- Starts Socket.IO server
- Registers all API routes
- Initializes the SQLite database connection

#### `backend/config/db.js`
Database initialization and connection setup.

Responsibilities:
- Opens the SQLite database file
- Creates tables if they do not exist
- Seeds default admin, technician, and user accounts
- Seeds default labs, equipment, and AI rules
- Applies simple schema updates for existing installations

#### `backend/routes/authRoutes.js`
Defines authentication-related endpoints.

#### `backend/routes/index.js`
Central route registration file for:
- fault routes
- AI routes
- dashboard routes
- equipment routes

#### `backend/middleware/authMiddleware.js`
Contains authentication and role-based access control logic.

It provides:
- `protect` for JWT verification
- `adminOnly` for admin-only routes
- `techOrAdmin` for technician/admin access

#### `backend/controllers/authController.js`
Handles login, profile retrieval, and technician management.

Functions:
- `loginUser`
- `getMe`
- `getTechnicians`
- `createTechnician`

#### `backend/controllers/faultController.js`
Handles all fault report operations.

Functions:
- `createFaultReport`  
  Creates a new fault report, stores image if provided, marks equipment as faulty, and emits real-time events.
- `getFaultReports`  
  Returns fault reports with equipment/lab/user/technician names.
- `updateFaultReport`  
  Updates fault status, technician assignment, and remarks.

#### `backend/controllers/equipmentController.js`
Handles equipment and lab-related data.

Functions:
- `getEquipment`
- `getEquipmentByQR`
- `createEquipment`
- `getLaboratories`

#### `backend/controllers/dashboardController.js`
Returns summary statistics for the dashboard.

#### `backend/controllers/aiController.js`
Provides the AI-lite suggestion engine.

It checks the problem description for keywords such as:
- network
- internet
- power
- display
- boot
- noise

It also checks the database for custom AI rules and includes warning logic for:
- cluster network issues
- repeated faults for the same equipment

### Frontend Files

#### `frontend/src/app/page.tsx`
Login page.

Users can:
- log in with existing accounts
- access the public fault reporting form

#### `frontend/src/app/report/page.tsx`
Public fault reporting page.

Users can:
- select an equipment item
- describe a problem
- optionally upload an image
- receive AI suggestions while typing
- submit a fault report

#### `frontend/src/app/map/page.tsx`
Public equipment map page.

Displays equipment grouped by lab and shows their current status.

#### `frontend/src/app/dashboard/page.tsx`
Main dashboard for authenticated users.

Shows:
- summary cards
- charts for fault activity
- overview of system health

#### `frontend/src/app/dashboard/faults/page.tsx`
Fault management page.

Provides:
- viewing fault reports
- reporting new faults
- QR code scanning for equipment selection
- assigning technicians
- updating fault status and remarks

#### `frontend/src/app/dashboard/equipment/page.tsx`
Equipment management page for admins.

Allows admins to:
- add new equipment
- view existing equipment
- generate/download QR codes

#### `frontend/src/app/dashboard/technicians/page.tsx`
Technician management page for admins.

Allows admins to:
- create technician accounts
- view technician directory

#### `frontend/src/components/Layout.tsx`
Shared dashboard shell and sidebar navigation.

Contains:
- navigation links
- logout button
- responsive sidebar layout
- Socket.IO toast notifications

#### `frontend/src/contexts/AuthContext.tsx`
Authentication context for the frontend.

Handles:
- login/logout state
- token persistence in local storage
- automatic redirect based on auth status

#### `frontend/src/lib/api.ts`
Axios configuration for backend communication.

Features:
- dynamic backend URL based on the current host
- automatic token attachment to requests

#### `frontend/src/lib/socket.ts`
Socket.IO client initialization.

---

## How the System Works

### 1. User Login
A user enters email/password on the login page.

The frontend sends a request to:
- `POST /api/auth/login`

If successful, the backend returns a JWT token and user data.

### 2. Fault Reporting
A user selects equipment and writes a description.

The frontend sends a multipart form request to:
- `POST /api/faults`

The backend:
- stores the report
- saves an uploaded image if present
- marks the equipment as faulty
- emits Socket.IO events for real-time updates

### 3. AI Suggestions
While the user types a description, the frontend sends the text to:
- `POST /api/ai/suggest`

The backend analyzes keywords and returns suggestions such as:
- check cables
- verify power supply
- inspect network connection
- inspect cooling/fan

### 4. Fault Management
Admin or technician users can manage faults from the dashboard.

They can update:
- status
- technician assignment
- remarks

### 5. Dashboard and Monitoring
The dashboard retrieves summary statistics from:
- `GET /api/dashboard/stats`

This provides insight into the health of the lab infrastructure.

---

## Database Design

The project uses SQLite with a single local database file: `backend/database.sqlite`.

### Tables

#### `users`
Stores user accounts.

Columns:
- `id`
- `name`
- `email`
- `password`
- `role`

Roles include:
- `admin`
- `technician`
- `user`

#### `laboratories`
Stores lab information.

Columns:
- `id`
- `name`
- `location`

#### `equipment`
Stores laboratory equipment records.

Columns:
- `id`
- `name`
- `lab_id`
- `status`
- `qr_code`
- `priority`

#### `fault_reports`
Stores all reported equipment issues.

Columns:
- `id`
- `eq_id`
- `user_id`
- `technician_id`
- `status`
- `description`
- `priority`
- `remarks`
- `image_url`
- `created_at`
- `updated_at`

#### `ai_rules`
Stores custom keyword-to-suggestion rules for the AI-lite engine.

Columns:
- `id`
- `keyword`
- `suggestion`

### Database Behavior
- Tables are auto-created on first run.
- Default demo accounts and demo equipment are inserted automatically.
- The database persists locally and does not require a separate server installation.

---

## API Reference

Base URL:
- Backend: `http://localhost:3001/api`

### Authentication Endpoints

#### `POST /api/auth/login`
Logs in a user and returns a JWT token.

Request body:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### `GET /api/auth/me`
Returns the current authenticated user profile.

#### `GET /api/auth/technicians`
Returns all technician accounts. Admin only.

#### `POST /api/auth/technicians`
Creates a new technician account. Admin only.

---

### Fault Endpoints

#### `GET /api/faults`
Returns all fault reports visible to the current user role.

#### `POST /api/faults`
Creates a new fault report.

Form-data fields:
- `eq_id`
- `description`
- `image` (optional)

#### `PUT /api/faults/:id`
Updates a fault report.

Allowed fields:
- `status`
- `technician_id`
- `remarks`

---

### AI Endpoints

#### `POST /api/ai/suggest`
Returns AI-lite suggestions based on the issue description.

Request body:
```json
{
  "description": "The network is not working",
  "eq_id": 1
}
```

---

### Dashboard Endpoints

#### `GET /api/dashboard/stats`
Returns summary statistics for the dashboard.

---

### Equipment Endpoints

#### `GET /api/equipment`
Returns all equipment with lab details.

#### `GET /api/equipment/qr/:qr`
Finds an equipment item by QR code.

#### `POST /api/equipment`
Adds new equipment. Admin only.

#### `GET /api/equipment/labs`
Returns the list of laboratories.

---

## Real-Time Features

The application uses Socket.IO for immediate updates.

Events:
- `new_fault`  
  Emitted when a new fault report is created.

- `update_fault`  
  Emitted when a fault is updated.

- `equipment_update`  
  Emitted when equipment is added or its status changes.

---

## UI Overview

### Public Pages
- Login page
- Public fault report form
- Public equipment map

### Authenticated Dashboard Pages
- Dashboard overview
- Fault reports management
- Equipment directory
- Technician management (admin only)

### UI Style
- Modern responsive design
- Dark/light friendly styling via Tailwind CSS
- Card-based layout
- Mobile-friendly navigation

---

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file if needed based on `env.example`.

### 2. Frontend Setup
```bash
cd frontend
npm install
```

### 3. Run the Backend
```bash
cd backend
npm run dev
```

The backend runs on:
- `http://localhost:3001`

### 4. Run the Frontend
```bash
cd frontend
npm run dev
```

The frontend runs on:
- `http://localhost:3000`

---

## Demo Accounts

The system seeds demo accounts automatically on first run.

- Admin
  - Email: `admin@example.com`
  - Password: `admin123`

- Technician
  - Email: `tech@example.com`
  - Password: `tech123`

- User
  - Email: `user@example.com`
  - Password: `user123`

---

## Notes and Important Details

- The backend uses SQLite, so no external database server is required.
- Images uploaded by users are stored in the `backend/uploads` folder.
- The frontend dynamically resolves the backend URL from the browser host, which helps with LAN access.
- QR code links may need to be adjusted to your local network IP depending on your environment.
- The current AI system is lightweight and keyword-based rather than a full machine-learning model.

---

## Summary

This project is a practical lab maintenance and fault-management platform with:
- a full backend API
- a modern React/Next.js frontend
- SQLite persistence
- role-based permissions
- real-time communication
- AI-based troubleshooting suggestions

It is especially suitable for university labs, technical training centers, and small-scale equipment monitoring environments.
