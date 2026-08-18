// =====================================================================
// Background Verification System - Role Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');

router.get('/', roleController.getAllRoles);
router.post('/', roleController.createRole);

module.exports = router;
