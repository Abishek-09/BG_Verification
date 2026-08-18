// =====================================================================
// Background Verification System - Upload Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/upload.middleware');
const uploadController = require('../controllers/upload.controller');

router.post('/', uploadMiddleware.single('file'), uploadController.uploadDocument);

module.exports = router;
