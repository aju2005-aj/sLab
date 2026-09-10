require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: '*', // Allow all origins for local network access
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new Server(server, {
  cors: corsOptions
});

// Pass io to routes if needed
app.set('io', io);

// Initialize DB
const db = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const { faultRouter, aiRouter, dashboardRouter, equipmentRouter } = require('./routes/index');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/faults', faultRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/equipment', equipmentRouter);

// Basic route
app.get('/', (req, res) => {
  res.send('Smart Lab Backend API is running');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

// Bind to 0.0.0.0 to be accessible across the network
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend or choose another PORT.`);
  } else {
    console.error('Backend server error:', error.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
