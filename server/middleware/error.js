import mongoose from 'mongoose';

/**
 * Global error handling middleware
 * Standardizes error responses across the API
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for debugging
  console.error('Error:', err);
  
  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} with value: ${value}`;
    
    error = new Error(message);
    error.statusCode = 400;
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }
  
  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = new Error(message);
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token expired';
    error = new Error(message);
    error.statusCode = 401;
  }
  
  // SyntaxError (invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON in request body';
    error = new Error(message);
    error.statusCode = 400;
  }
  
  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Format error response
  const errorResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  };
  
  // Send error response
  res.status(statusCode).json(errorResponse);
  
  // Log error to monitoring service in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    // Here you would typically log to a service like Sentry or New Relic
    // Example: Sentry.captureException(err);
  }
};

export default errorHandler; 