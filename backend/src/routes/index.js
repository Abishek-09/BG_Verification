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
const biometricRoutes = require('./biometric.routes');

router.use('/persons', personRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/upload', uploadRoutes);
router.use('/payment', paymentRoutes);
router.use('/biometric', biometricRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Background Verification System API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
