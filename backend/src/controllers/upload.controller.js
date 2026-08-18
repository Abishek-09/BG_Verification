// =====================================================================
// Background Verification System - Upload Controller
// =====================================================================

exports.uploadDocument = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Salary slip uploaded successfully.',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    url: fileUrl
  });
};
