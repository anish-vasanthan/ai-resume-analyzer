const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const { generateInterviewQuestions } = require('../utils/groqService');

// @route   POST /api/mock-interview/start
router.post('/start', protect, [
  body('role').trim().notEmpty().withMessage('Role is required')
    .isLength({ min: 2, max: 100 }).withMessage('Role must be between 2 and 100 characters'),
  body('resumeId').optional().isInt().withMessage('Resume ID must be a valid integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { resumeId, role } = req.body;

    // Enhanced: Get full resume data for better question generation
    let parsedData = { 
      skills: [], 
      experience: [],
      education: [],
      projects: [],
      certifications: []
    };
    
    if (resumeId) {
      const resume = await Resume.findByPk(resumeId);
      if (resume && resume.userId === req.user.id) {
        parsedData = {
          skills: resume.parsedSkills || [],
          experience: resume.parsedExperience || [],
          education: resume.parsedEducation || [],
          projects: resume.parsedProjects || [],
          certifications: resume.parsedCertifications || [],
          name: resume.parsedName || '',
          detectedRole: resume.detectedRole || role
        };
        console.log(`Generating questions for ${role} based on resume:`, {
          skills: parsedData.skills.length,
          experience: parsedData.experience.length,
          projects: parsedData.projects.length
        });
      }
    }

    const questionSet = await generateInterviewQuestions(role, parsedData);

    // Map all 7 categories into a flat questions array with type labels
    const mapQ = (arr, type) => (arr || []).map(q => ({
      question:    q.question,
      options:     q.options,
      correct:     (q.correct || q.correctAnswer || '').trim().toUpperCase(),
      explanation: q.explanation,
      type,
      userAnswer:  '',
      feedback:    '',
      score:       0,
      isCorrect:   0
    }));

    const questions = [
      ...mapQ(questionSet.skill_technical,   'skill_technical'),
      ...mapQ(questionSet.skill_scenario,    'skill_scenario'),
      ...mapQ(questionSet.skill_concept,     'skill_concept'),
      ...mapQ(questionSet.project_technical, 'project_technical'),
      ...mapQ(questionSet.project_scenario,  'project_scenario'),
      ...mapQ(questionSet.hr_skill,          'hr_skill'),
      ...mapQ(questionSet.hr_project,        'hr_project'),
    ];

    console.log(`Generated ${questions.length} questions for ${role}`);

    const mockInterview = await MockInterview.create({
      userId:   req.user.id,
      resumeId: resumeId || null,
      role,
      questions
    });

    res.status(201).json({ success: true, data: mockInterview });
  } catch (error) {
    console.error('Start error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/mock-interview/:id/answer
router.post('/:id/answer', protect, [
  param('id').isInt().withMessage('Invalid mock interview ID'),
  body('questionIndex').isInt({ min: 0 }).withMessage('Question index must be a non-negative integer'),
  body('answer').trim().notEmpty().withMessage('Answer is required')
    .isLength({ max: 1000 }).withMessage('Answer must not exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { questionIndex, answer } = req.body;

    const mockInterview = await MockInterview.findByPk(req.params.id);
    if (!mockInterview) return res.status(404).json({ success: false, message: 'Mock interview not found' });
    if (mockInterview.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const idx = parseInt(questionIndex, 10);
    if (idx >= mockInterview.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    // Deep-clone the array so Sequelize detects the change
    const questions = JSON.parse(JSON.stringify(mockInterview.questions));

    const q             = questions[idx];
    const userAnswer    = String(answer).trim().toUpperCase();
    const correctAnswer = String(q.correct || '').trim().toUpperCase();
    const isCorrect     = userAnswer === correctAnswer ? 1 : 0;

    questions[idx].userAnswer = userAnswer;
    questions[idx].isCorrect  = isCorrect;
    questions[idx].score      = isCorrect ? 10 : 0;
    questions[idx].feedback   = isCorrect
      ? `Correct! ${q.explanation || 'Well done!'}`
      : `Incorrect. The correct answer is ${correctAnswer}. ${q.explanation || ''}`;

    // Force Sequelize to see the JSONB column as changed (works for both MySQL and PostgreSQL)
    mockInterview.questions = questions;
    mockInterview.changed('questions', true);
    await mockInterview.save();

    console.log(`Q${idx}: user=${userAnswer} correct=${correctAnswer} isCorrect=${isCorrect}`);

    res.json({
      success: true,
      data: {
        evaluation: {
          isCorrect:     isCorrect === 1,
          correctAnswer,
          score:         isCorrect ? 10 : 0,
          feedback:      questions[idx].feedback
        },
        questionIndex: idx
      }
    });
  } catch (error) {
    console.error('Answer error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/mock-interview/:id/complete
router.post('/:id/complete', protect, [
  param('id').isInt().withMessage('Invalid mock interview ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mockInterview = await MockInterview.findByPk(req.params.id);
    if (!mockInterview) return res.status(404).json({ success: false, message: 'Mock interview not found' });
    if (mockInterview.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const questions = mockInterview.questions;
    const answered  = questions.filter(q => q.userAnswer && q.userAnswer !== '');
    const correct   = answered.filter(q => q.isCorrect === 1 || q.isCorrect === true).length;
    const total     = questions.length;
    const overallScore = total > 0 ? Math.round((correct / total) * 100) : 0;

    console.log(`Complete: answered=${answered.length} correct=${correct} total=${total} score=${overallScore}`);

    let overallFeedback;
    if (overallScore >= 80)      overallFeedback = `Excellent! You got ${correct}/${total} correct. You have strong knowledge in this domain!`;
    else if (overallScore >= 60) overallFeedback = `Good job! You got ${correct}/${total} correct. Review the topics you missed to improve further.`;
    else if (overallScore >= 40) overallFeedback = `Fair attempt. You got ${correct}/${total} correct. Focus on strengthening your fundamentals.`;
    else                         overallFeedback = `You got ${correct}/${total} correct. Keep practicing — review the explanations for each question.`;

    await mockInterview.update({
      overallScore,
      overallFeedback,
      status:      'completed',
      completedAt: new Date()
    });

    // Re-fetch to return fresh data
    const updated = await MockInterview.findByPk(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Complete error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/mock-interview
router.get('/', protect, async (req, res) => {
  try {
    const mockInterviews = await MockInterview.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, count: mockInterviews.length, data: mockInterviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/mock-interview/:id
router.get('/:id', protect, [
  param('id').isInt().withMessage('Invalid mock interview ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const mockInterview = await MockInterview.findByPk(req.params.id);
    if (!mockInterview) return res.status(404).json({ success: false, message: 'Mock interview not found' });
    if (mockInterview.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, data: mockInterview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/mock-interview/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const mockInterview = await MockInterview.findByPk(req.params.id);
    if (!mockInterview) return res.status(404).json({ success: false, message: 'Mock interview not found' });
    if (mockInterview.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    await mockInterview.destroy();
    console.log(`Deleted mock interview ${req.params.id} for user ${req.user.id}`);
    res.json({ success: true, message: 'Mock interview deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
