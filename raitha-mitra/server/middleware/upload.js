const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store images directly on Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'raitha-mitra',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File too large. Max 5MB.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

module.exports = { upload, handleUploadError };