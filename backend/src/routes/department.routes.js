// =====================================================================
// Background Verification System - Department Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');

router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.createDepartment);

module.exports = router;
