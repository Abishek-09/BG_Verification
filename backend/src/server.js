// =====================================================================
// Background Verification System - Express + Socket.IO Server
// Camera-Based Barcode Attendance & Employee Verification API
// =====================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const apiRoutes = require('./routes');
const { prisma } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Prevent uncaught errors from crashing the backend process
process.on('uncaughtException', (err) => {
  console.error('⚠️ [PROCESS] Uncaught Exception caught safely:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [PROCESS] Unhandled Rejection caught safely:', reason);
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// Make io accessible to route handlers via app.get('io')
app.set('io', io);

// Enable CORS & Body Parsing (Standard JSON + URL-encoded)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files Static Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api/v1', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Background Verification & Camera Barcode Attendance API',
    documentation: '/api/v1/health',
    status: 'Running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// Start Server (use server.listen for Socket.IO support)
server.listen(PORT, async () => {
  console.log(`=====================================================`);
  console.log(`🚀 Verification & Attendance Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api/v1`);
  console.log(`🔌 Socket.IO WebSocket server active on ws://localhost:${PORT}`);
  console.log(`📷 Camera Barcode Scanner Endpoint active on /api/v1/attendance/barcode-punch`);
  console.log(`=====================================================`);
  try {
    await prisma.$connect();
    console.log(`✅ Successfully connected to PostgreSQL via Prisma!`);
  } catch (err) {
    console.error(`⚠️ PostgreSQL connection error:`, err.message);
  }
});
