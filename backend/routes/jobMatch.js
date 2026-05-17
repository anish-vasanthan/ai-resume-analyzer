const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs').promises;
const multer   = require('multer');
const { param, body, validationResult } = require('express-validator');
const { protect }       = require('../middleware/auth');
const Resume            = require('../models/Resume');
const { extractPDF, extractDOCX } = require('../utils/resumeParser');
const { analyzeJobMatch }         = require('../utils/groqService');

/* ── multer for JD file uploads (temp storage) ── */
const jdUpload = multer({
  dest: 'uploads/jd-temp/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed'));
  }
});

/* ── helper: extract text from any supported file ── */
async function extractJDText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.pdf')              return await extractPDF(filePath);
  if (ext === '.docx' || ext === '.doc') return await extractDOCX(filePath);
  if (ext === '.txt')              return await fs.readFile(filePath, 'utf-8');
  throw new Error('Unsupported file type');
}

/* ─────────────────────────────────────────────────────────────
   POST /api/job-match/:resumeId
   Body: { jobDescription: "text" }  OR  multipart file upload
   Analyzes how well a resume matches a job description
───────────────────────────────────────────────────────────── */
router.post('/:resumeId',
  protect,
  jdUpload.single('jdFile'),
  [param('resumeId').isInt().withMessage('Invalid resume ID')],
  async (req, res) => {
    let tempFilePath = null;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const resume = await Resume.findByPk(req.params.resumeId);
      if (!resume)                    return res.status(404).json({ success: false, message: 'Resume not found' });
      if (resume.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

      /* get JD text — from file upload OR body text */
      let jobDescriptionText = '';

      if (req.file) {
        tempFilePath = req.file.path;
        jobDescriptionText = await extractJDText(req.file.path, req.file.originalname);
      } else if (req.body.jobDescription) {
        jobDescriptionText = String(req.body.jobDescription).trim();
      } else {
        return res.status(400).json({ success: false, message: 'Provide a job description text or upload a file' });
      }

      if (jobDescriptionText.length < 50) {
        return res.status(400).json({ success: false, message: 'Job description is too short (minimum 50 characters)' });
      }

      console.log(`🎯 Analyzing job match for resume ${resume.id} — JD length: ${jobDescriptionText.length}`);

      const result = await analyzeJobMatch(
        resume.extractedText,
        jobDescriptionText,
        resume.parsedSkills || []
      );

      console.log(`✅ Job match complete — score: ${result.matchScore}%`);

      res.json({
        success: true,
        data: {
          resumeId:   resume.id,
          fileName:   resume.fileName,
          detectedRole: resume.detectedRole,
          ...result,
          analyzedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Job match error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    } finally {
      /* clean up temp JD file */
      if (tempFilePath) {
        try { await fs.unlink(tempFilePath); } catch {}
      }
    }
  }
);

/* ─────────────────────────────────────────────────────────────
   GET /api/job-match/resumes
   Returns all resumes for the current user (for the selector)
───────────────────────────────────────────────────────────── */
router.get('/resumes/list', protect, async (req, res) => {
  try {
    const resumes = await Resume.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'fileName', 'detectedRole', 'atsScore', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
