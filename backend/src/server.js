// =====================================================================
// Background Verification System - Express Server Startup
// =====================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const { prisma } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & Body Parsing
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
    message: 'Welcome to Background Verification REST API',
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

// Start Server
app.listen(PORT, async () => {
  console.log(`=====================================================`);
  console.log(`🚀 Background Verification Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api/v1`);
  console.log(`=====================================================`);
  try {
    await prisma.$connect();
    console.log(`✅ Successfully connected to PostgreSQL via Prisma!`);
  } catch (err) {
    console.error(`⚠️ PostgreSQL connection error:`, err.message);
  }
});
