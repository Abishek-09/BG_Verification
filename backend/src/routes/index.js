// =====================================================================
// Background Verification System - Central Router Config
// =====================================================================

const express = require('express');
const router = express.Router();

const personRoutes = require('./person.routes');
const departmentRoutes = require('./department.routes');
const roleRoutes = require('./role.routes');
const uploadRoutes = require('./upload.routes');
const paymentRoutes = require('./payment.routes');
const attendanceRoutes = require('./attendance.routes');
const authRoutes = require('./auth.routes');
const deviceRoutes = require('./device.routes');

router.use('/auth', authRoutes);
router.use('/persons', personRoutes);
router.use('/employees', personRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/upload', uploadRoutes);
router.use('/payment', paymentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/devices', deviceRoutes);

// Backwards-compatible alias for any legacy links
router.use('/biometric', attendanceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Background Verification & Camera Barcode Attendance API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
