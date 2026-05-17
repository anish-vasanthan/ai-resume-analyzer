const express = require('express');
const router = express.Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs').promises;
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Resume = require('../models/Resume');

/* ── avatar upload (stores as base64 in DB — no extra file server needed) ── */
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed (JPG, PNG, WEBP, GIF)'));
  }
});

// @route   GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    const resumes = await Resume.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'fileName', 'detectedRole', 'atsScore', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { ...user.toJSON(), resumes }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/user/profile  — update name / email
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);
    if (name)  user.name  = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    await user.save();
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/user/avatar  — upload profile picture
router.post('/avatar', protect, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

    // Resize/compress: reject files that would produce very large base64 strings
    // 2MB binary → ~2.7MB base64; TEXT column handles this fine now
    const mime    = req.file.mimetype;
    const b64     = req.file.buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${b64}`;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.avatar = dataUrl;
    await user.save();

    res.json({ success: true, data: { avatar: dataUrl } });
  } catch (error) {
    console.error('Avatar upload error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save avatar. Please try a smaller image.' });
  }
});

// @route   DELETE /api/user/avatar  — remove profile picture
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    user.avatar = null;
    await user.save();
    res.json({ success: true, data: { avatar: null } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
