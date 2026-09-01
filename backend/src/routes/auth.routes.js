// =====================================================================
// Auth Routes Definition
// =====================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.post('/admin-login', authController.adminLogin);
router.post('/admin-register', authController.adminRegister);
router.post('/employee-login', authController.employeeLogin);
router.get('/me', authenticateJWT, authController.getMe);

module.exports = router;
