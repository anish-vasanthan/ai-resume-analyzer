/**
 * Global Error Handling Middleware
 * Handles different types of errors and returns appropriate responses
 */

function errorHandler(err, req, res, next) {
  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    message: err.message,
    status: err.status || 500
  };
  
  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    errorLog.stack = err.stack;
  }
  
  console.error('Error:', errorLog);

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      errors: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} already exists`
      }))
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle Gemini API rate limit errors
  if (err.response && err.response.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'AI service rate limit exceeded. Please try again later.'
    });
  }

  // Handle Gemini API errors
  if (err.response && err.response.status >= 400 && err.response.status < 500) {
    return res.status(err.response.status).json({
      success: false,
      message: 'AI service error: ' + (err.response.data?.error?.message || err.message)
    });
  }

  // Handle multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB.'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
