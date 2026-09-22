# Running Smart Lab Manager on Linux

This guide assumes a newly installed Ubuntu/Debian-based Linux system. The same
steps apply to most Linux distributions with equivalent package commands.

## 1. Update the system

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Install required tools

Install Git, curl, build tools, and PostgreSQL:

```bash
sudo apt install -y git curl build-essential postgresql postgresql-contrib
```

Install Node.js LTS using NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the installations:

```bash
node --version
npm --version
git --version
psql --version
```

Node.js 18 or newer is required.

## 3. Start and enable PostgreSQL

```bash
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
```

The status should show `active (running)`.

## 4. Create the application database and user

Create a PostgreSQL user. Replace `YOUR_DATABASE_PASSWORD` with a password of
your choice:

```bash
sudo -u postgres createuser --createdb --pwprompt slab_app
```

Create the database owned by that user:

```bash
sudo -u postgres createdb --owner=slab_app slab
```

If the user or database already exists, do not recreate it. You can verify them
with:

```bash
sudo -u postgres psql -c "\du"
sudo -u postgres psql -l
```

## 5. Get the project

Clone the repository:

```bash
git clone https://github.com/aju2005-aj/sLab.git
cd sLab
```

If the project is already on the computer, open a terminal in its project
directory instead.

## 6. Install backend dependencies

```bash
cd backend
npm install
```

Create the backend environment file:

```bash
cp env.example .env
```

Open `.env`:

```bash
nano .env
```

Set the database password to the password chosen when creating `slab_app`:

```env
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://slab_app:YOUR_DATABASE_PASSWORD@localhost:5432/slab
```

Save the file with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`.

## 7. Install frontend dependencies

Open a second terminal, then run:

```bash
cd /path/to/sLab/frontend
npm install
```

The frontend automatically calls the backend at port `3001`. To use a
different backend address, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001/api
```

## 8. Start the application

Use two terminals.

Terminal 1, backend:

```bash
cd /path/to/sLab/backend
npm start
```

The backend should listen on `http://localhost:3001`.

Terminal 2, frontend:

```bash
cd /path/to/sLab/frontend
npm run dev
```

Open `http://localhost:3000` in a browser.

For another device on the same network, open
`http://YOUR_LINUX_IP:3000`. Find the Linux machine's IP with:

```bash
hostname -I
```

If another device cannot connect, allow the application ports through the
firewall:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw status
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
`backend/.env` exists and that `DATABASE_URL` contains a real password, not the
placeholder `YOUR_DATABASE_PASSWORD`.

### Port already in use

Check which process is using a port:

```bash
sudo ss -ltnp | grep -E ':3000|:3001'
```

Stop that process or choose unused ports and update the matching configuration.

### Check the backend directly

```bash
curl http://localhost:3001/
```

The response should say that the Smart Lab Backend API is running.
