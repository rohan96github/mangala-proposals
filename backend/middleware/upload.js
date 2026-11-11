const multer = require('multer');
const path = require('path');

// Separate storage for XLSX imports
const xlsxStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
});

// Image-only upload (for profile photos)
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
  }),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) =>
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

// XLSX-only upload (for bulk profile import)
const xlsxUpload = multer({
  storage: xlsxStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExcel = ['.xlsx', '.xls', '.csv'].includes(ext);
    const isMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'application/x-zip-compressed',
      'application/zip',
    ].includes(file.mimetype);
    cb(null, isExcel || isMime);
  },
});

// Default export is imageUpload (backward-compatible)
module.exports = imageUpload;
module.exports.xlsx = xlsxUpload;
