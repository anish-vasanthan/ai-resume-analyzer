/**
 * Performance Tests for Database Queries
 * Tests query performance with indexes on Resume model
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

const { sequelize } = require('../config/database');
const Resume = require('../models/Resume');
const User = require('../models/User');

// Check if database tests should be skipped
const SKIP_DATABASE_TESTS = process.env.SKIP_DATABASE_TESTS === 'true';

// Skip entire suite if database tests are disabled
const describeOrSkip = SKIP_DATABASE_TESTS ? describe.skip : describe;

describeOrSkip('Database Performance Tests', () => {
  let testUser;
  let testResumes = [];
  const PERFORMANCE_THRESHOLD_MS = 1000; // Queries should complete within 1 second (reasonable for test environment)

  beforeAll(async () => {
    // Connect to database with timeout
    try {
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ]);
      console.log('✅ Database connection established for performance tests');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.warn('⚠️  Skipping performance tests - database not accessible');
      console.warn('   These tests require database connectivity');
      console.warn('   Run tests with a local database or in production environment');
      throw error;
    }
    
    // Sync models (this will create indexes)
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    
    // Create multiple test resumes for performance testing
    const resumePromises = [];
    for (let i = 0; i < 50; i++) {
      resumePromises.push(
        Resume.create({
          userId: testUser.id,
          fileName: `resume_${i}.pdf`,
          filePath: `/uploads/resume_${i}.pdf`,
          fileType: 'pdf',
          extractedText: `Sample resume text for resume ${i}`,
          parsedName: `Test User ${i}`,
          parsedEmail: `user${i}@example.com`,
          parsedPhone: `555-000${i}`,
          parsedEducation: { degree: 'Bachelor', field: 'Computer Science' },
          parsedSkills: ['JavaScript', 'Node.js', 'React'],
          parsedCertifications: [],
          parsedProjects: [],
          parsedExperience: [],
          atsScore: 70 + (i % 30),
          strengths: ['Good technical skills'],
          weaknesses: ['Limited experience'],
          missingKeywords: [],
          suggestions: [],
          grammarIssues: [],
          formattingIssues: [],
          detectedRole: i % 3 === 0 ? 'Software Engineer' : i % 3 === 1 ? 'Data Scientist' : 'Product Manager',
          selfIntroduction: `I am a ${i % 3 === 0 ? 'Software Engineer' : i % 3 === 1 ? 'Data Scientist' : 'Product Manager'}`
        })
      );
    }
    
    testResumes = await Promise.all(resumePromises);
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    await Resume.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('Index Creation Tests', () => {
    it('should have created indexes on Resume table', async () => {
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

  describe('Query Performance with Indexes', () => {
    it('should retrieve resumes by userId efficiently', async () => {
      const startTime = Date.now();
      
      const resumes = await Resume.findAll({
        where: { userId: testUser.id }
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resumes.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should retrieve resumes sorted by createdAt efficiently', async () => {
      const startTime = Date.now();
      
      const resumes = await Resume.findAll({
        where: { userId: testUser.id },
        order: [['createdAt', 'DESC']]
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resumes.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      
      // Verify sorting
      for (let i = 0; i < resumes.length - 1; i++) {
        expect(new Date(resumes[i].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(resumes[i + 1].createdAt).getTime());
      }
    });

    it('should filter resumes by detectedRole efficiently', async () => {
      const startTime = Date.now();
      
      const resumes = await Resume.findAll({
        where: { 
          userId: testUser.id,
          detectedRole: 'Software Engineer'
        }
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resumes.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      
      // Verify all results have correct role
      resumes.forEach(resume => {
        expect(resume.detectedRole).toBe('Software Engineer');
      });
    });

    it('should handle combined filters efficiently', async () => {
      const startTime = Date.now();
      
      const resumes = await Resume.findAll({
        where: { 
          userId: testUser.id,
          detectedRole: 'Data Scientist'
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resumes.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe('Resume Retrieval Performance', () => {
    it('should retrieve single resume by id efficiently', async () => {
      const testResume = testResumes[0];
      
      const startTime = Date.now();
      
      const resume = await Resume.findOne({
        where: { 
          id: testResume.id,
          userId: testUser.id
        }
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resume).toBeDefined();
      expect(resume.id).toBe(testResume.id);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should retrieve user-specific resumes efficiently', async () => {
      const startTime = Date.now();
      
      const resumes = await Resume.findAll({
        where: { userId: testUser.id },
        attributes: ['id', 'userId', 'fileName', 'detectedRole', 'atsScore', 'createdAt']
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resumes.length).toBe(50);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      
      // Verify all resumes belong to test user
      resumes.forEach(resume => {
        expect(resume.userId).toBe(testUser.id);
      });
    });
  });

  describe('Pagination Performance', () => {
    it('should handle paginated queries efficiently', async () => {
      const pageSize = 10;
      const page = 1;
      const offset = (page - 1) * pageSize;
      
      const startTime = Date.now();
      
      const { count, rows } = await Resume.findAndCountAll({
        where: { userId: testUser.id },
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset: offset
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(count).toBe(50);
      expect(rows.length).toBe(pageSize);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should handle multiple page requests efficiently', async () => {
      const pageSize = 10;
      const totalPages = 3;
      
      for (let page = 1; page <= totalPages; page++) {
        const offset = (page - 1) * pageSize;
        
        const startTime = Date.now();
        
        const resumes = await Resume.findAll({
          where: { userId: testUser.id },
          order: [['createdAt', 'DESC']],
          limit: pageSize,
          offset: offset
        });
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        expect(resumes.length).toBe(pageSize);
        expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      }
    });

    it('should count total resumes efficiently for pagination', async () => {
      const startTime = Date.now();
      
      const count = await Resume.count({
        where: { userId: testUser.id }
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(count).toBe(50);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe('Complex Query Performance', () => {
    it('should handle role-based filtering with pagination efficiently', async () => {
      const startTime = Date.now();
      
      const { count, rows } = await Resume.findAndCountAll({
        where: { 
          userId: testUser.id,
          detectedRole: 'Software Engineer'
        },
        order: [['createdAt', 'DESC']],
        limit: 5,
        offset: 0
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(count).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should handle multiple sort criteria efficiently', async () => {
      const startTime = Date.now();
      
      const resumes = await Resume.findAll({
        where: { userId: testUser.id },
        order: [
          ['detectedRole', 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit: 20
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(resumes.length).toBe(20);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should retrieve latest resume by user efficiently', async () => {
      const startTime = Date.now();
      
      const latestResume = await Resume.findOne({
        where: { userId: testUser.id },
        order: [['createdAt', 'DESC']]
      });
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(latestResume).toBeDefined();
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });

  describe('Concurrent Query Performance', () => {
    it('should handle multiple concurrent queries efficiently', async () => {
      const startTime = Date.now();
      
      const queries = [
        Resume.findAll({ where: { userId: testUser.id } }),
        Resume.findAll({ where: { userId: testUser.id, detectedRole: 'Software Engineer' } }),
        Resume.findAll({ where: { userId: testUser.id }, order: [['createdAt', 'DESC']], limit: 10 }),
        Resume.count({ where: { userId: testUser.id } }),
        Resume.findOne({ where: { userId: testUser.id }, order: [['createdAt', 'DESC']] })
      ];
      
      const results = await Promise.all(queries);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results[0].length).toBe(50);
      expect(results[1].length).toBeGreaterThan(0);
      expect(results[2].length).toBe(10);
      expect(results[3]).toBe(50);
      expect(results[4]).toBeDefined();
      
      // Concurrent queries should complete faster than sequential
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 5);
    });
  });
});
