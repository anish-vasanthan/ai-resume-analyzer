import axios from 'axios';

// Mock axios before importing api
jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    default: {
      create: jest.fn(() => mockAxiosInstance)
    }
  };
});

describe('API Service Production Configuration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Environment Variable Configuration', () => {
    it('should read REACT_APP_API_URL from environment', () => {
      // Set environment variable
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com';
      
      // Re-import to pick up new env var
      jest.resetModules();
      jest.mock('axios', () => {
        const mockAxiosInstance = {
          interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
          }
        };
        return {
          create: jest.fn(() => mockAxiosInstance)
        };
      });
      
      const axiosMock = require('axios');
      require('./api');
      
      // Verify axios.create was called with correct baseURL
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.example.com/api'
        })
      );
      
      // Restore original env
      process.env.REACT_APP_API_URL = originalEnv;
    });

    it('should default to http://localhost:5000 when REACT_APP_API_URL is not set', () => {
      // Clear environment variable
      const originalEnv = process.env.REACT_APP_API_URL;
      delete process.env.REACT_APP_API_URL;
      
      // Re-import to pick up cleared env var
      jest.resetModules();
      jest.mock('axios', () => {
        const mockAxiosInstance = {
          interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
          }
        };
        return {
          create: jest.fn(() => mockAxiosInstance)
        };
      });
      
      const axiosMock = require('axios');
      require('./api');
      
      // Verify axios.create was called with default baseURL
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:5000/api'
        })
      );
      
      // Restore original env
      process.env.REACT_APP_API_URL = originalEnv;
    });

    it('should set withCredentials to true for CORS', () => {
      jest.resetModules();
      const axiosMock = require('axios');
      require('./api');
      
      // Verify axios.create was called with withCredentials
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          withCredentials: true
        })
      );
    });
  });

  describe('Error Interceptor', () => {
    it('should handle 401 errors by clearing token and redirecting to login', () => {
      // Set up localStorage with a token
      localStorage.setItem('token', 'test-token');
      
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      // Create a 401 error
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      // Import api to get the interceptor
      jest.resetModules();
      const axiosMock = require('axios');
      require('./api');
      
      // Get the error handler from the response interceptor
      const responseInterceptorCall = axiosMock.create().interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      // Call the error handler
      return errorHandler(error).catch((e) => {
        // Verify token was removed
        expect(localStorage.getItem('token')).toBeNull();
        
        // Verify redirect to login
        expect(window.location.href).toBe('/login');
        
        // Verify error message
        expect(e.message).toBe('Session expired. Please login again.');
      });
    });

    it('should handle network errors with user-friendly message', () => {
      // Create a network error (request made but no response)
      const error = {
        request: {}
      };

      // Import api to get the interceptor
      jest.resetModules();
      const axiosMock = require('axios');
      require('./api');
      
      // Get the error handler from the response interceptor
      const responseInterceptorCall = axiosMock.create().interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      // Call the error handler
      return errorHandler(error).catch((e) => {
        expect(e.message).toBe('Network error. Please check your connection and try again.');
      });
    });

    it('should handle server errors with descriptive messages', () => {
      // Create a 500 error
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      // Import api to get the interceptor
      jest.resetModules();
      const axiosMock = require('axios');
      require('./api');
      
      // Get the error handler from the response interceptor
      const responseInterceptorCall = axiosMock.create().interceptors.response.use.mock.calls[0];
      const errorHandler = responseInterceptorCall[1];

      // Call the error handler
      return errorHandler(error).catch((e) => {
        expect(e.message).toBe('Server error: Internal server error');
      });
    });

    it('should pass through successful responses', () => {
      const response = { data: { success: true } };
      
      // Import api to get the interceptor
      jest.resetModules();
      const axiosMock = require('axios');
      require('./api');
      
      // Get the success handler from the response interceptor
      const responseInterceptorCall = axiosMock.create().interceptors.response.use.mock.calls[0];
      const successHandler = responseInterceptorCall[0];
      
      const result = successHandler(response);
      
      expect(result).toBe(response);
    });
  });

  describe('Build Command', () => {
    it('should have build script in package.json', () => {
      // This test verifies the build command exists
      const packageJson = require('../../package.json');
      
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts.build).toBe('react-scripts build');
    });
  });
});
