const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs').promises;
const multer  = require('multer');
const { param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Resume = require('../models/Resume');
const { extractPDF, extractDOCX } = require('../utils/resumeParser');
const { enhanceResume } = require('../utils/groqService');

/* ── multer for optional JD file upload ── */
const jdUpload = multer({
  dest: path.join(__dirname, '../uploads/jd-temp/'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed for job description'));
  }
});

/* ── helper: extract text from JD file ── */
async function extractJDText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.pdf')                    return await extractPDF(filePath);
  if (ext === '.docx' || ext === '.doc') return await extractDOCX(filePath);
  if (ext === '.txt')                    return await fs.readFile(filePath, 'utf-8');
  throw new Error('Unsupported file type');
}

// @route   POST /api/enhance/:id
// @desc    AI-enhance a resume — optionally tailored to a job description
// @body    jobDescription (text) OR multipart jdFile upload
router.post('/:id',
  protect,
  jdUpload.single('jdFile'),
  [param('id').isUUID().withMessage('Invalid resume ID')],
  async (req, res) => {
    let tempFilePath = null;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const resume = await Resume.findByPk(req.params.id);
      if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
      if (resume.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

      // Extract job description text if provided
      let jobDescriptionText = '';
      if (req.file) {
        tempFilePath = req.file.path;
        jobDescriptionText = await extractJDText(req.file.path, req.file.originalname);
        console.log(`📄 JD file uploaded: ${req.file.originalname} (${jobDescriptionText.length} chars)`);
      } else if (req.body.jobDescription) {
        jobDescriptionText = String(req.body.jobDescription).trim();
        console.log(`📝 JD text provided: ${jobDescriptionText.length} chars`);
      }

      const hasJD = jobDescriptionText.length > 50;
      console.log(`🔮 Enhancing resume ${resume.id} for role: ${resume.detectedRole}${hasJD ? ' (JD-tailored)' : ' (general)'}`);

      const parsedData = {
        name:           resume.parsedName,
        email:          resume.parsedEmail,
        phone:          resume.parsedPhone,
        skills:         resume.parsedSkills         || [],
        education:      resume.parsedEducation       || [],
        experience:     resume.parsedExperience      || [],
        projects:       resume.parsedProjects        || [],
        certifications: resume.parsedCertifications  || []
      };

      const result = await enhanceResume(
        resume.extractedText,
        parsedData,
        resume.detectedRole || 'Software Engineer',
        jobDescriptionText
      );

      // Persist enhanced version
      await resume.update({
        enhancedResume: result,
        enhancedAt:     new Date()
      });

      console.log(`✅ Enhancement complete — ${result.mistakes.length} mistakes found, score: ${result.improvementScore}, JD-tailored: ${result.tailoredToJD}`);

      res.json({
        success: true,
        data: {
          originalAtsScore:  resume.atsScore,
          improvementScore:  result.improvementScore,
          enhancedSections:  result.enhancedSections,
          mistakes:          result.mistakes,
          jdKeywordsAdded:   result.jdKeywordsAdded   || [],
          jdKeywordsMissing: result.jdKeywordsMissing  || [],
          tailoredToJD:      result.tailoredToJD       || false,
          summary:           result.summary,
          enhancedAt:        new Date()
        }
      });
    } catch (error) {
      console.error('Enhancement error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (tempFilePath) {
        try { await fs.unlink(tempFilePath); } catch {}
      }
    }
  }
);

// @route   GET /api/enhance/:id
// @desc    Return previously saved enhancement (no AI call)
router.get('/:id', protect, [
  param('id').isUUID().withMessage('Invalid resume ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const resume = await Resume.findByPk(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    if (!resume.enhancedResume) {
      return res.status(404).json({ success: false, message: 'No enhancement found. Run enhancement first.' });
    }

    res.json({
      success: true,
      data: {
        originalAtsScore:  resume.atsScore,
        improvementScore:  resume.enhancedResume.improvementScore,
        enhancedSections:  resume.enhancedResume.enhancedSections,
        mistakes:          resume.enhancedResume.mistakes,
        jdKeywordsAdded:   resume.enhancedResume.jdKeywordsAdded   || [],
        jdKeywordsMissing: resume.enhancedResume.jdKeywordsMissing  || [],
        tailoredToJD:      resume.enhancedResume.tailoredToJD       || false,
        summary:           resume.enhancedResume.summary,
        enhancedAt:        resume.enhancedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ── multer error handler (must have 4 args to be recognised as error middleware) ── */
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  // Clean up any temp file multer may have written before rejecting
  if (req.file && req.file.path) {
    fs.unlink(req.file.path).catch(() => {});
  }
  const status = err.name === 'MulterError' || err.message.includes('Only') ? 400 : 500;
  res.status(status).json({ success: false, message: err.message });
});

module.exports = router;
