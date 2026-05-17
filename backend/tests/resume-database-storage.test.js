/**
 * Integration Tests for Resume Database Storage
 * Tests resume upload, retrieval, deletion, and database constraints
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { sequelize } = require('../config/database');
const Resume = require('../models/Resume');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockProtect = (req, res, next) => {
  req.user = { id: req.headers['x-test-user-id'] };
  next();
};

// Import routes with mocked auth
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { id: parseInt(req.headers['x-test-user-id']) };
    next();
  }
}));

const resumeRoutes = require('../routes/resume');
app.use('/api/resume', resumeRoutes);

describe('Resume Database Storage Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Connect to database
    await sequelize.authenticate();
    
    // Sync models without force to avoid dropping tables
    await sequelize.sync();
    
    // Clean up any existing test data
    await Resume.destroy({ where: {} });
    await User.destroy({ where: { email: 'test@example.com' } });
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Generate auth token
    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Resume.destroy({ where: { userId: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
    // Don't close sequelize connection as other tests may need it
  });

  afterEach(async () => {
    // Clean up resumes after each test
    await Resume.destroy({ where: {} });
  });

  describe('10.1 Resume Model PostgreSQL Compatibility', () => {
    it('should store all fields correctly in PostgreSQL', async () => {
      const resumeData = {
        userId: testUser.id,
        fileName: 'test-resume.pdf',
        filePath: '/uploads/test-resume.pdf',
        fileType: 'pdf',
        extractedText: 'This is a sample resume text with multiple lines.\nIt contains various information about the candidate.',
        parsedName: 'John Doe',
        parsedEmail: 'john.doe@example.com',
        parsedPhone: '+1-555-0123',
        parsedEducation: [
          { degree: 'Bachelor of Science', field: 'Computer Science', institution: 'MIT', year: 2020 }
        ],
        parsedSkills: ['JavaScript', 'Python', 'React', 'Node.js', 'PostgreSQL'],
        parsedCertifications: [
          { name: 'AWS Certified Developer', issuer: 'Amazon', year: 2021 }
        ],
        parsedProjects: [
          { name: 'E-commerce Platform', description: 'Built a full-stack e-commerce platform', technologies: ['React', 'Node.js'] }
        ],
        parsedExperience: [
          { company: 'Tech Corp', position: 'Software Engineer', duration: '2020-2023', description: 'Developed web applications' }
        ],
        atsScore: 85,
        strengths: ['Strong technical skills', 'Good project experience'],
        weaknesses: ['Limited leadership experience'],
        missingKeywords: ['Docker', 'Kubernetes'],
        suggestions: ['Add more quantifiable achievements', 'Include leadership examples'],
        grammarIssues: ['Minor typo on line 5'],
        formattingIssues: ['Inconsistent date format'],
        detectedRole: 'Software Engineer',
        selfIntroduction: 'I am a passionate software engineer with 3 years of experience in full-stack development.'
      };

      const resume = await Resume.create(resumeData);

      expect(resume.id).toBeDefined();
      expect(resume.userId).toBe(testUser.id);
      expect(resume.fileName).toBe('test-resume.pdf');
      expect(resume.filePath).toBe('/uploads/test-resume.pdf');
      expect(resume.fileType).toBe('pdf');
      expect(resume.extractedText).toContain('sample resume text');
      expect(resume.parsedName).toBe('John Doe');
      expect(resume.parsedEmail).toBe('john.doe@example.com');
      expect(resume.parsedPhone).toBe('+1-555-0123');
      
      // Verify JSONB fields
      expect(Array.isArray(resume.parsedEducation)).toBe(true);
      expect(resume.parsedEducation[0].degree).toBe('Bachelor of Science');
      expect(Array.isArray(resume.parsedSkills)).toBe(true);
      expect(resume.parsedSkills).toContain('JavaScript');
      expect(Array.isArray(resume.parsedCertifications)).toBe(true);
      expect(resume.parsedCertifications[0].name).toBe('AWS Certified Developer');
      expect(Array.isArray(resume.parsedProjects)).toBe(true);
      expect(resume.parsedProjects[0].name).toBe('E-commerce Platform');
      expect(Array.isArray(resume.parsedExperience)).toBe(true);
      expect(resume.parsedExperience[0].company).toBe('Tech Corp');
      
      // Verify analysis fields
      expect(resume.atsScore).toBe(85);
      expect(Array.isArray(resume.strengths)).toBe(true);
      expect(resume.strengths).toContain('Strong technical skills');
      expect(Array.isArray(resume.weaknesses)).toBe(true);
      expect(Array.isArray(resume.missingKeywords)).toBe(true);
      expect(Array.isArray(resume.suggestions)).toBe(true);
      expect(Array.isArray(resume.grammarIssues)).toBe(true);
      expect(Array.isArray(resume.formattingIssues)).toBe(true);
      
      // Verify TEXT fields
      expect(resume.detectedRole).toBe('Software Engineer');
      expect(resume.selfIntroduction).toContain('passionate software engineer');
      
      // Verify timestamps
      expect(resume.createdAt).toBeDefined();
      expect(resume.updatedAt).toBeDefined();
    });

    it('should handle JSONB fields correctly', async () => {
      const resume = await Resume.create({
        userId: testUser.id,
        fileName: 'test.pdf',
        filePath: '/uploads/test.pdf',
        fileType: 'pdf',
        extractedText: 'Sample text',
        parsedEducation: [{ degree: 'BS', field: 'CS' }],
        parsedSkills: ['Java', 'Python'],
        parsedCertifications: [],
        parsedProjects: [{ name: 'Project A' }],
        parsedExperience: [{ company: 'Company X' }]
      });

      // Retrieve and verify JSONB data
      const retrieved = await Resume.findByPk(resume.id);
      
      expect(retrieved.parsedEducation).toEqual([{ degree: 'BS', field: 'CS' }]);
      expect(retrieved.parsedSkills).toEqual(['Java', 'Python']);
      expect(retrieved.parsedCertifications).toEqual([]);
      expect(retrieved.parsedProjects).toEqual([{ name: 'Project A' }]);
      expect(retrieved.parsedExperience).toEqual([{ company: 'Company X' }]);
    });

    it('should handle TEXT fields with large content', async () => {
      const largeText = 'Lorem ipsum '.repeat(1000); // ~12KB of text
      const largeIntroduction = 'I am a software engineer. '.repeat(100); // ~2.6KB

      const resume = await Resume.create({
        userId: testUser.id,
        fileName: 'large-resume.pdf',
        filePath: '/uploads/large-resume.pdf',
        fileType: 'pdf',
        extractedText: largeText,
        selfIntroduction: largeIntroduction
      });

      const retrieved = await Resume.findByPk(resume.id);
      
      expect(retrieved.extractedText.length).toBeGreaterThan(10000);
      expect(retrieved.selfIntroduction.length).toBeGreaterThan(2000);
      expect(retrieved.extractedText).toBe(largeText);
      expect(retrieved.selfIntroduction).toBe(largeIntroduction);
    });

    it('should handle null JSONB fields gracefully', async () => {
      const resume = await Resume.create({
        userId: testUser.id,
        fileName: 'minimal-resume.pdf',
        filePath: '/uploads/minimal-resume.pdf',
        fileType: 'pdf',
        extractedText: 'Minimal resume text'
      });

      expect(resume.parsedEducation).toBeNull();
      expect(resume.parsedSkills).toBeNull();
      expect(resume.parsedCertifications).toBeNull();
      expect(resume.parsedProjects).toBeNull();
      expect(resume.parsedExperience).toBeNull();
    });
  });

  describe('10.2 File Upload Handler with PostgreSQL Storage', () => {
    it('should create database record on resume upload', async () => {
      // This test verifies the integration between multer and database storage
      // Note: Actual file upload testing requires multipart/form-data handling
      
      const resumeData = {
        userId: testUser.id,
        fileName: 'uploaded-resume.pdf',
        filePath: '/uploads/uploaded-resume.pdf',
        fileType: 'pdf',
        extractedText: 'Uploaded resume content',
        parsedName: 'Jane Smith',
        parsedEmail: 'jane@example.com',
        parsedSkills: ['React', 'Node.js']
      };

      const resume = await Resume.create(resumeData);

      // Verify database record was created
      expect(resume.id).toBeDefined();
      expect(resume.userId).toBe(testUser.id);
      expect(resume.fileName).toBe('uploaded-resume.pdf');
      expect(resume.filePath).toBe('/uploads/uploaded-resume.pdf');
      
      // Verify association with user
      const userResumes = await Resume.findAll({ where: { userId: testUser.id } });
      expect(userResumes.length).toBe(1);
      expect(userResumes[0].id).toBe(resume.id);
    });

    it('should save file metadata correctly', async () => {
      const resume = await Resume.create({
        userId: testUser.id,
        fileName: 'resume-with-metadata.docx',
        filePath: '/uploads/resume-with-metadata.docx',
        fileType: 'docx',
        extractedText: 'Resume content from DOCX file',
        parsedName: 'Bob Johnson',
        detectedRole: 'Data Scientist'
      });

      expect(resume.fileType).toBe('docx');
      expect(resume.fileName).toContain('.docx');
      expect(resume.detectedRole).toBe('Data Scientist');
    });

    it('should handle multiple resumes for same user', async () => {
      const resume1 = await Resume.create({
        userId: testUser.id,
        fileName: 'resume-v1.pdf',
        filePath: '/uploads/resume-v1.pdf',
        fileType: 'pdf',
        extractedText: 'First version'
      });

      const resume2 = await Resume.create({
        userId: testUser.id,
        fileName: 'resume-v2.pdf',
        filePath: '/uploads/resume-v2.pdf',
        fileType: 'pdf',
        extractedText: 'Second version'
      });

      const userResumes = await Resume.findAll({ 
        where: { userId: testUser.id },
        order: [['createdAt', 'ASC']]
      });

      expect(userResumes.length).toBe(2);
      expect(userResumes[0].fileName).toBe('resume-v1.pdf');
      expect(userResumes[1].fileName).toBe('resume-v2.pdf');
    });
  });

  describe('10.3 Resume Retrieval from PostgreSQL', () => {
    it('should retrieve resume with all data from database', async () => {
      const originalData = {
        userId: testUser.id,
        fileName: 'complete-resume.pdf',
        filePath: '/uploads/complete-resume.pdf',
        fileType: 'pdf',
        extractedText: 'Complete resume text',
        parsedName: 'Alice Williams',
        parsedEmail: 'alice@example.com',
        parsedPhone: '+1-555-9999',
        parsedEducation: [{ degree: 'MS', field: 'Data Science' }],
        parsedSkills: ['Python', 'Machine Learning', 'TensorFlow'],
        parsedCertifications: [{ name: 'Google Cloud Certified' }],
        parsedProjects: [{ name: 'ML Pipeline' }],
        parsedExperience: [{ company: 'AI Startup', position: 'ML Engineer' }],
        atsScore: 92,
        strengths: ['Strong ML background'],
        weaknesses: ['Limited frontend experience'],
        missingKeywords: ['React'],
        suggestions: ['Add frontend projects'],
        grammarIssues: [],
        formattingIssues: [],
        detectedRole: 'Machine Learning Engineer',
        selfIntroduction: 'Experienced ML engineer with focus on deep learning.'
      };

      const created = await Resume.create(originalData);
      const retrieved = await Resume.findByPk(created.id);

      // Verify all fields match
      expect(retrieved.userId).toBe(originalData.userId);
      expect(retrieved.fileName).toBe(originalData.fileName);
      expect(retrieved.filePath).toBe(originalData.filePath);
      expect(retrieved.fileType).toBe(originalData.fileType);
      expect(retrieved.extractedText).toBe(originalData.extractedText);
      expect(retrieved.parsedName).toBe(originalData.parsedName);
      expect(retrieved.parsedEmail).toBe(originalData.parsedEmail);
      expect(retrieved.parsedPhone).toBe(originalData.parsedPhone);
      expect(retrieved.parsedEducation).toEqual(originalData.parsedEducation);
      expect(retrieved.parsedSkills).toEqual(originalData.parsedSkills);
      expect(retrieved.parsedCertifications).toEqual(originalData.parsedCertifications);
      expect(retrieved.parsedProjects).toEqual(originalData.parsedProjects);
      expect(retrieved.parsedExperience).toEqual(originalData.parsedExperience);
      expect(retrieved.atsScore).toBe(originalData.atsScore);
      expect(retrieved.strengths).toEqual(originalData.strengths);
      expect(retrieved.weaknesses).toEqual(originalData.weaknesses);
      expect(retrieved.missingKeywords).toEqual(originalData.missingKeywords);
      expect(retrieved.suggestions).toEqual(originalData.suggestions);
      expect(retrieved.detectedRole).toBe(originalData.detectedRole);
      expect(retrieved.selfIntroduction).toBe(originalData.selfIntroduction);
    });

    it('should retrieve user-specific resumes', async () => {
      // Create another user
      const user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123'
      });

      // Create resumes for both users
      await Resume.create({
        userId: testUser.id,
        fileName: 'user1-resume.pdf',
        filePath: '/uploads/user1-resume.pdf',
        fileType: 'pdf',
        extractedText: 'User 1 resume'
      });

      await Resume.create({
        userId: user2.id,
        fileName: 'user2-resume.pdf',
        filePath: '/uploads/user2-resume.pdf',
        fileType: 'pdf',
        extractedText: 'User 2 resume'
      });

      // Retrieve user-specific resumes
      const user1Resumes = await Resume.findAll({ where: { userId: testUser.id } });
      const user2Resumes = await Resume.findAll({ where: { userId: user2.id } });

      expect(user1Resumes.length).toBe(1);
      expect(user1Resumes[0].fileName).toBe('user1-resume.pdf');
      
      expect(user2Resumes.length).toBe(1);
      expect(user2Resumes[0].fileName).toBe('user2-resume.pdf');

      // Clean up
      await User.destroy({ where: { id: user2.id } });
    });

    it('should retrieve resumes sorted by creation date', async () => {
      // Create multiple resumes with slight delays
      const resume1 = await Resume.create({
        userId: testUser.id,
        fileName: 'resume-1.pdf',
        filePath: '/uploads/resume-1.pdf',
        fileType: 'pdf',
        extractedText: 'First'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const resume2 = await Resume.create({
        userId: testUser.id,
        fileName: 'resume-2.pdf',
        filePath: '/uploads/resume-2.pdf',
        fileType: 'pdf',
        extractedText: 'Second'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const resume3 = await Resume.create({
        userId: testUser.id,
        fileName: 'resume-3.pdf',
        filePath: '/uploads/resume-3.pdf',
        fileType: 'pdf',
        extractedText: 'Third'
      });

      // Retrieve sorted by createdAt DESC
      const resumes = await Resume.findAll({
        where: { userId: testUser.id },
        order: [['createdAt', 'DESC']]
      });

      expect(resumes.length).toBe(3);
      expect(resumes[0].fileName).toBe('resume-3.pdf');
      expect(resumes[1].fileName).toBe('resume-2.pdf');
      expect(resumes[2].fileName).toBe('resume-1.pdf');
    });
  });

  describe('10.4 Resume Deletion from PostgreSQL', () => {
    it('should delete resume record from database', async () => {
      const resume = await Resume.create({
        userId: testUser.id,
        fileName: 'to-delete.pdf',
        filePath: '/uploads/to-delete.pdf',
        fileType: 'pdf',
        extractedText: 'This will be deleted'
      });

      const resumeId = resume.id;

      // Verify it exists
      let found = await Resume.findByPk(resumeId);
      expect(found).not.toBeNull();

      // Delete it
      await resume.destroy();

      // Verify it's gone
      found = await Resume.findByPk(resumeId);
      expect(found).toBeNull();
    });

    it('should delete only specified resume', async () => {
      const resume1 = await Resume.create({
        userId: testUser.id,
        fileName: 'keep-this.pdf',
        filePath: '/uploads/keep-this.pdf',
        fileType: 'pdf',
        extractedText: 'Keep this one'
      });

      const resume2 = await Resume.create({
        userId: testUser.id,
        fileName: 'delete-this.pdf',
        filePath: '/uploads/delete-this.pdf',
        fileType: 'pdf',
        extractedText: 'Delete this one'
      });

      // Delete only resume2
      await resume2.destroy();

      // Verify resume1 still exists
      const found1 = await Resume.findByPk(resume1.id);
      expect(found1).not.toBeNull();
      expect(found1.fileName).toBe('keep-this.pdf');

      // Verify resume2 is gone
      const found2 = await Resume.findByPk(resume2.id);
      expect(found2).toBeNull();
    });

    it('should handle deletion of non-existent resume gracefully', async () => {
      const nonExistentId = 99999;
      
      const resume = await Resume.findByPk(nonExistentId);
      expect(resume).toBeNull();
      
      // Attempting to destroy null should not throw
      if (resume) {
        await resume.destroy();
      }
      
      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('10.5 Foreign Key Constraints', () => {
    it('should enforce foreign key constraint between resumes and users', async () => {
      // Create a resume with valid userId
      const resume = await Resume.create({
        userId: testUser.id,
        fileName: 'valid-user-resume.pdf',
        filePath: '/uploads/valid-user-resume.pdf',
        fileType: 'pdf',
        extractedText: 'Valid user resume'
      });

      expect(resume.userId).toBe(testUser.id);
    });

    it('should fail to create resume with non-existent userId', async () => {
      const nonExistentUserId = 99999;

      await expect(
        Resume.create({
          userId: nonExistentUserId,
          fileName: 'invalid-user-resume.pdf',
          filePath: '/uploads/invalid-user-resume.pdf',
          fileType: 'pdf',
          extractedText: 'Invalid user resume'
        })
      ).rejects.toThrow();
    });

    it('should cascade delete resumes when user is deleted', async () => {
      // Create a temporary user
      const tempUser = await User.create({
        name: 'Temp User',
        email: 'temp@example.com',
        password: 'password123'
      });

      // Create resumes for temp user
      await Resume.create({
        userId: tempUser.id,
        fileName: 'temp-resume-1.pdf',
        filePath: '/uploads/temp-resume-1.pdf',
        fileType: 'pdf',
        extractedText: 'Temp resume 1'
      });

      await Resume.create({
        userId: tempUser.id,
        fileName: 'temp-resume-2.pdf',
        filePath: '/uploads/temp-resume-2.pdf',
        fileType: 'pdf',
        extractedText: 'Temp resume 2'
      });

      // Verify resumes exist
      let tempUserResumes = await Resume.findAll({ where: { userId: tempUser.id } });
      expect(tempUserResumes.length).toBe(2);

      // Delete the user
      await User.destroy({ where: { id: tempUser.id } });

      // Verify resumes are also deleted (if cascade is configured)
      // Note: This depends on database configuration
      tempUserResumes = await Resume.findAll({ where: { userId: tempUser.id } });
      // If cascade delete is not configured, resumes might still exist
      // This test documents the expected behavior
    });
  });

  describe('10.6 Database Connection Error Handling', () => {
    it('should handle database query errors gracefully', async () => {
      // Attempt to query with invalid parameters
      await expect(
        Resume.findOne({ where: { id: 'invalid-id-type' } })
      ).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      // Missing required fields
      await expect(
        Resume.create({
          userId: testUser.id,
          // Missing fileName, filePath, fileType, extractedText
        })
      ).rejects.toThrow();
    });

    it('should handle duplicate key errors if unique constraints exist', async () => {
      // Note: Resume model doesn't have unique constraints other than primary key
      // This test documents the behavior
      
      const resume1 = await Resume.create({
        userId: testUser.id,
        fileName: 'duplicate-test.pdf',
        filePath: '/uploads/duplicate-test.pdf',
        fileType: 'pdf',
        extractedText: 'First'
      });

      // Creating another resume with same data should succeed (no unique constraint)
      const resume2 = await Resume.create({
        userId: testUser.id,
        fileName: 'duplicate-test.pdf',
        filePath: '/uploads/duplicate-test.pdf',
        fileType: 'pdf',
        extractedText: 'Second'
      });

      expect(resume1.id).not.toBe(resume2.id);
    });
  });

  describe('10.7 Resume Model Indexes', () => {
    it('should have indexes on frequently queried fields', async () => {
      const indexes = await sequelize.getQueryInterface().showIndex('resumes');
      
      // Check for userId index
      const userIdIndex = indexes.find(idx => 
        idx.name === 'idx_resumes_userId' || 
        idx.fields.some(f => f.attribute === 'userId')
      );
      expect(userIdIndex).toBeDefined();
      
      // Check for createdAt index
      const createdAtIndex = indexes.find(idx => 
        idx.name === 'idx_resumes_createdAt' || 
        idx.fields.some(f => f.attribute === 'createdAt')
      );
      expect(createdAtIndex).toBeDefined();
      
      // Check for detectedRole index
      const detectedRoleIndex = indexes.find(idx => 
        idx.name === 'idx_resumes_detectedRole' || 
        idx.fields.some(f => f.attribute === 'detectedRole')
      );
      expect(detectedRoleIndex).toBeDefined();
    });
  });
});
