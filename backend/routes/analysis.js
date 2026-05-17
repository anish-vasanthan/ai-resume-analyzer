const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Resume = require('../models/Resume');
const { analyzeResume, generateSelfIntroduction } = require('../utils/groqService');

// @route   POST /api/analysis/reanalyze/:id
router.post('/reanalyze/:id', protect, async (req, res) => {
  try {
    const resume = await Resume.findByPk(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const parsedData = {
      name: resume.parsedName, email: resume.parsedEmail, phone: resume.parsedPhone,
      education: resume.parsedEducation || [], skills: resume.parsedSkills || [],
      certifications: resume.parsedCertifications || [], projects: resume.parsedProjects || [],
      experience: resume.parsedExperience || []
    };

    const analysis = await analyzeResume(resume.extractedText, parsedData);

    await resume.update({
      atsScore: analysis.atsScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.missingKeywords,
      suggestions: analysis.suggestions,
      grammarIssues: analysis.grammarIssues,
      formattingIssues: analysis.formattingIssues,
      ...(analysis.scoreBreakdown ? { scoreBreakdown: analysis.scoreBreakdown } : {})
    });

    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/analysis/regenerate-intro/:id
router.post('/regenerate-intro/:id', protect, async (req, res) => {
  try {
    const resume = await Resume.findByPk(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const parsedData = {
      name: resume.parsedName, skills: resume.parsedSkills || [],
      education: resume.parsedEducation || [], experience: resume.parsedExperience || [],
      projects: resume.parsedProjects || [], certifications: resume.parsedCertifications || []
    };

    const selfIntroduction = await generateSelfIntroduction(parsedData, resume.detectedRole);
    await resume.update({ selfIntroduction });

    res.json({ success: true, data: { selfIntroduction } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analysis/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const resumes = await Resume.findAll({
      where: { userId: req.user.id },
      attributes: ['atsScore', 'parsedSkills', 'detectedRole']
    });

    if (resumes.length === 0) {
      return res.json({ success: true, data: { totalResumes: 0, averageAtsScore: 0, topSkills: [], roleDistribution: {} } });
    }

    const totalResumes = resumes.length;
    const averageAtsScore = Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / totalResumes);

    const skillsMap = {};
    resumes.forEach(r => {
      (r.parsedSkills || []).forEach(skill => {
        skillsMap[skill] = (skillsMap[skill] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const roleDistribution = {};
    resumes.forEach(r => {
      const role = r.detectedRole || 'Other';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    res.json({ success: true, data: { totalResumes, averageAtsScore, topSkills, roleDistribution } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
