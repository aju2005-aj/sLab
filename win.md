# Running Smart Lab Manager on Windows

This guide is for a newly installed Windows 10 or Windows 11 computer.

## 1. Install Node.js

1. Open <https://nodejs.org/>.
2. Download the current **LTS** Windows installer.
3. Run the `.msi` installer.
4. Keep the default options, including **Add to PATH**.
5. Restart Command Prompt or PowerShell after installation.

Verify it in PowerShell:

```powershell
node --version
npm --version
```

Node.js 18 or newer is required.

## 2. Install Git

1. Open <https://git-scm.com/download/win>.
2. Download and install Git for Windows.
3. Keep the default installer options.
4. Open a new PowerShell window and verify:

```powershell
git --version
```

Git is only needed to clone or update the project. It is not required if the
project folder is copied to the computer another way.

## 3. Install PostgreSQL

1. Open <https://www.postgresql.org/download/windows/>.
2. Download the PostgreSQL Windows installer.
3. During installation, include:
   - PostgreSQL Server
   - pgAdmin 4
   - Command Line Tools
4. Remember the password entered for the PostgreSQL `postgres` user.
5. Keep the default port `5432`.
6. Restart PowerShell after installation.

Verify the PostgreSQL command-line tool:

```powershell
psql --version
```

If `psql` is not recognized, add the PostgreSQL `bin` directory to the Windows
PATH. It is usually similar to:

```text
C:\Program Files\PostgreSQL\16\bin
```

## 4. Create the application database

Open **SQL Shell (psql)** from the Start menu, or use PowerShell if PostgreSQL
is on PATH:

```powershell
psql -U postgres
```

Enter the PostgreSQL password when prompted. Run these SQL commands:

```sql
CREATE USER slab_app WITH PASSWORD 'YOUR_DATABASE_PASSWORD' CREATEDB;
CREATE DATABASE slab OWNER slab_app;
\q
```

Use a strong password and remember it for the backend `.env` file. If the user
or database already exists, do not run the corresponding `CREATE` command
again.

## 5. Get the project

Using Git in PowerShell:

```powershell
git clone https://github.com/aju2005-aj/sLab.git
cd sLab
```

If the project is already downloaded, open PowerShell in that project folder.
In File Explorer, right-click the folder and choose **Open in Terminal**.

## 6. Install backend dependencies

```powershell
cd backend
npm install
Copy-Item env.example .env
notepad .env
```

Set the values in `.env`:

```env
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://slab_app:YOUR_DATABASE_PASSWORD@localhost:5432/slab
```

Replace `YOUR_DATABASE_PASSWORD` with the password used when creating
`slab_app`. Do not leave the placeholder in the file.

## 7. Install frontend dependencies

Open a second PowerShell window:

```powershell
cd C:\path\to\sLab\frontend
npm install
```

The frontend automatically calls the backend at port `3001`. To use a
different backend address, create `frontend/.env.local`:

```powershell
notepad .env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001/api
```

## 8. Start the application

Use two PowerShell windows.

Window 1, backend:

```powershell
cd C:\path\to\sLab\backend
npm start
```

The backend should listen on `http://localhost:3001`.

Window 2, frontend:

```powershell
cd C:\path\to\sLab\frontend
npm run dev
```

Open `http://localhost:3000` in a browser.

For another device on the same network, open
`http://YOUR_WINDOWS_IP:3000`. Find the Windows machine's IP with:

```powershell
ipconfig
```

Use the **IPv4 Address** shown under the active Wi-Fi or Ethernet adapter.
If Windows Firewall asks whether Node.js should communicate on the network,
allow it on private networks. You can also add firewall rules in an elevated
PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Smart Lab Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "Smart Lab Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Private
```

## 9. Demo accounts

The backend creates these accounts and sample equipment on the first successful
database initialization:

```text
Admin:       admin@example.com / admin123
Technician:  tech@example.com   / tech123
User:        user@example.com   / user123
```

## Troubleshooting

### PostgreSQL password error

If the backend reports `client password must be a string`, check that
`backend\.env` exists and that `DATABASE_URL` contains a real password, not the
placeholder `YOUR_DATABASE_PASSWORD`.

### `psql` is not recognized

Use the full executable path, for example:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

Or add the PostgreSQL `bin` folder to the system PATH and open a new terminal.

### Port already in use

Check ports:

```powershell
Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue
```

Stop the identified application or choose unused ports and update the matching
configuration.

### Check the backend directly

```powershell
Invoke-WebRequest http://localhost:3001/
```

The response should say that the Smart Lab Backend API is running.
