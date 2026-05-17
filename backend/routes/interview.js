const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Resume = require('../models/Resume');
const { generateInterviewQuestions } = require('../utils/groqService');

// @route   GET /api/interview/questions/:resumeId
router.get('/questions/:resumeId', protect, [
  param('resumeId').isInt().withMessage('Invalid resume ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const resume = await Resume.findByPk(req.params.resumeId);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const parsedData = { skills: resume.parsedSkills || [] };
    const questions = await generateInterviewQuestions(resume.detectedRole, parsedData);

    res.json({ success: true, data: { role: resume.detectedRole, questions } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/interview/questions/custom
router.post('/questions/custom', protect, [
  body('role').trim().notEmpty().withMessage('Role is required')
    .isLength({ min: 2, max: 100 }).withMessage('Role must be between 2 and 100 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { role, skills } = req.body;

    const questions = await generateInterviewQuestions(role, { skills: skills || [] });
    res.json({ success: true, data: { role, questions } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
