require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new Server(server, {
  cors: corsOptions
});

app.set('io', io);

const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const { faultRouter, aiRouter, dashboardRouter, equipmentRouter } = require('./routes/index');

app.use('/api/auth', authRoutes);
app.use('/api/faults', faultRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/equipment', equipmentRouter);

app.get('/', (req, res) => {
  res.send('Smart Lab Backend API is running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend or choose another PORT.`);
  } else {
    console.error('Backend server error:', error.message);
  }
  process.exit(1);
});

async function startServer() {
  try {
    await require('./config/db').ready;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Backend startup aborted: PostgreSQL is not available.');
    console.error(error.message);
    process.exitCode = 1;
  }
}

startServer();
