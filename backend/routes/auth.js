const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/google
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { credential } = req.body;

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no email' });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({ where: { googleId } });

    if (!user) {
      // Check if email already registered with password
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link Google account to existing email account
        await user.update({ googleId, avatar: avatar || user.avatar });
      } else {
        // Create brand-new Google user (no password)
        user = await User.create({
          name,
          email,
          password: null,
          googleId,
          avatar
        });
      }
    } else {
      // Update avatar in case it changed
      if (avatar && user.avatar !== avatar) {
        await user.update({ avatar });
      }
    }

    res.json({
      success: true,
      data: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        avatar: user.avatar,
        token:  generateToken(user.id)
      }
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
