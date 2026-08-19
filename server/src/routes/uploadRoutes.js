const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

// @desc    Upload an image to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: req.file.path, // This is the Cloudinary secure URL
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload', error: error.message });
  }
});

module.exports = router;
