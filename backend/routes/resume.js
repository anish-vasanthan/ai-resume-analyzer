const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Resume = require('../models/Resume');
const { extractPDF, extractDOCX, parseResumeText } = require('../utils/resumeParser');
const { analyzeResume, detectRole, generateSelfIntroduction } = require('../utils/groqService');

// @route   POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }

    const fileType = path.extname(req.file.originalname).toLowerCase().slice(1);
    
    // Validate file type
    if (!['pdf', 'docx'].includes(fileType)) {
      return res.status(400).json({ success: false, message: 'Only PDF and DOCX files are allowed' });
    }
    
    // Validate file size (5MB max)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size must not exceed 5MB' });
    }

    let extractedText;

    if (fileType === 'pdf') {
      extractedText = await extractPDF(req.file.path);
    } else if (fileType === 'docx') {
      extractedText = await extractDOCX(req.file.path);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file format' });
    }

    const parsedData = parseResumeText(extractedText);
    const analysis = await analyzeResume(extractedText, parsedData);
    const detectedRole = await detectRole(parsedData);
    const selfIntroduction = await generateSelfIntroduction(parsedData, detectedRole);

    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType,
      extractedText,
      parsedName: parsedData.name,
      parsedEmail: parsedData.email,
      parsedPhone: parsedData.phone,
      parsedEducation: parsedData.education,
      parsedSkills: parsedData.skills,
      parsedCertifications: parsedData.certifications,
      parsedProjects: parsedData.projects,
      parsedExperience: parsedData.experience,
      atsScore: analysis.atsScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.missingKeywords,
      suggestions: analysis.suggestions,
      grammarIssues: analysis.grammarIssues,
      formattingIssues: analysis.formattingIssues,
      scoreBreakdown: analysis.scoreBreakdown || null,
      detectedRole,
      selfIntroduction
    });

    res.status(201).json({ success: true, data: formatResume(resume) });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/resume
router.get('/', protect, async (req, res) => {
  try {
    const resumes = await Resume.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['extractedText'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: resumes.length, data: resumes.map(formatResume) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/resume/:id
router.get('/:id', protect, [
  param('id').isInt().withMessage('Invalid resume ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: formatResume(resume) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/resume/:id
router.delete('/:id', protect, [
  param('id').isInt().withMessage('Invalid resume ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    try { await fs.unlink(resume.filePath); } catch (e) { /* file may not exist */ }
    await resume.destroy();

    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: shape resume data for frontend
function formatResume(r) {
  return {
    _id: r.id,
    id: r.id,
    fileName: r.fileName,
    fileType: r.fileType,
    detectedRole: r.detectedRole,
    selfIntroduction: r.selfIntroduction,
    createdAt: r.createdAt,
    parsedData: {
      name: r.parsedName,
      email: r.parsedEmail,
      phone: r.parsedPhone,
      education: r.parsedEducation || [],
      skills: r.parsedSkills || [],
      certifications: r.parsedCertifications || [],
      projects: r.parsedProjects || [],
      experience: r.parsedExperience || []
    },
    analysis: {
      atsScore: r.atsScore,
      scoreBreakdown: r.scoreBreakdown || null,
      strengths: r.strengths || [],
      weaknesses: r.weaknesses || [],
      missingKeywords: r.missingKeywords || [],
      suggestions: r.suggestions || [],
      grammarIssues: r.grammarIssues || [],
      formattingIssues: r.formattingIssues || []
    }
  };
}

module.exports = router;
