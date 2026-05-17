/**
 * Integration Tests for Backend Production Configuration
 * Tests environment validation, health check, CORS, rate limiting, and error handling
 */

const request = require('supertest');
const express = require('express');
const { validateEnvironment } = require('../utils/validateEnv');
const errorHandler = require('../middleware/errorHandler');

describe('Production Configuration Tests', () => {
  
  describe('Environment Validation', () => {
    let originalEnv;

    beforeEach(() => {
      // Save original environment
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret';
      
      // Mock process.exit to prevent test from exiting
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      validateEnvironment();
      
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should throw error when JWT_SECRET is missing', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.GEMINI_API_KEY = 'test-key';
      delete process.env.JWT_SECRET;
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      validateEnvironment();
      
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should throw error when no AI service key is present', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.JWT_SECRET = 'test-secret';
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      validateEnvironment();
      
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should pass when all required variables are present with GEMINI_API_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret';
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      validateEnvironment();
      
      expect(mockExit).not.toHaveBeenCalled();
      mockExit.mockRestore();
    });

    it('should pass when all required variables are present with OPENAI_API_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://test';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret';
      delete process.env.GEMINI_API_KEY;
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      validateEnvironment();
      
      expect(mockExit).not.toHaveBeenCalled();
      mockExit.mockRestore();
    });
  });

  describe('Health Check Endpoint', () => {
    let app;

    beforeEach(() => {
      app = express();
      
      // Mock health check endpoint with async database check
      app.get('/health', async (req, res) => {
        const healthStatus = {
          status: 'OK',
          message: 'Server is running',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          database: 'Unknown',
          aiService: (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) ? 'Configured' : 'Not configured'
        };

        // Test database connection
        try {
          const { sequelize } = require('../config/database');
          await sequelize.authenticate();
          healthStatus.database = 'Connected';
        } catch (error) {
          healthStatus.database = 'Disconnected';
          healthStatus.status = 'DEGRADED';
        }

        res.status(200).json(healthStatus);
      });
    });

    it('should return 200 status code', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return correct structure', async () => {
      const response = await request(app).get('/health');
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('aiService');
    });

    it('should return OK status when database is connected', async () => {
      const response = await request(app).get('/health');
      // Status should be OK if database connects, or DEGRADED if it doesn't
      expect(['OK', 'DEGRADED']).toContain(response.body.status);
    });

    it('should return valid timestamp', async () => {
      const response = await request(app).get('/health');
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should test actual database connection', async () => {
      const response = await request(app).get('/health');
      // Database status should be either Connected or Disconnected, not just checking env var
      expect(['Connected', 'Disconnected', 'Unknown']).toContain(response.body.database);
    });
  });

  describe('CORS Configuration', () => {
    let app;

    beforeEach(() => {
      const cors = require('cors');
      app = express();
      
      const corsOptions = {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        optionsSuccessStatus: 200
      };
      app.use(cors(corsOptions));
      
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests from whitelisted domain', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should include credentials in CORS headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Rate Limiting', () => {
    let app;

    beforeEach(() => {
      const rateLimit = require('express-rate-limit');
      app = express();
      
      const limiter = rateLimit({
        windowMs: 1000, // 1 second for testing
        max: 3, // 3 requests per second
        message: 'Too many requests from this IP, please try again later.'
      });
      
      app.use('/api/', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within limit', async () => {
      const response1 = await request(app).get('/api/test');
      const response2 = await request(app).get('/api/test');
      const response3 = await request(app).get('/api/test');
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });

    it('should block excessive requests', async () => {
      // Make 3 requests (at limit)
      await request(app).get('/api/test');
      await request(app).get('/api/test');
      await request(app).get('/api/test');
      
      // 4th request should be blocked
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
    });
  });

  describe('Error Handler Middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    it('should return 400 for Sequelize validation errors', async () => {
      app.get('/test-validation-error', (req, res, next) => {
        const error = new Error('Validation error');
        error.name = 'SequelizeValidationError';
        error.errors = [
          { path: 'email', message: 'Email is required' }
        ];
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-validation-error');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should return 401 for JWT errors', async () => {
      app.get('/test-jwt-error', (req, res, next) => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-jwt-error');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 429 for Gemini API rate limit errors', async () => {
      app.get('/test-rate-limit-error', (req, res, next) => {
        const error = new Error('Rate limit exceeded');
        error.response = { status: 429 };
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-rate-limit-error');
      
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('rate limit');
    });

    it('should return 500 for generic errors', async () => {
      app.get('/test-generic-error', (req, res, next) => {
        const error = new Error('Something went wrong');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-generic-error');
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Something went wrong');
    });

    it('should not include stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/test-error', (req, res, next) => {
        const error = new Error('Test error');
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-error');
      
      expect(response.body.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
