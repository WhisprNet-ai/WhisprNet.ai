/**
 * Response Handler Utility
 * Provides standardized methods for API responses
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object|Array} data - Data to send
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 400)
 * @param {Object} errors - Additional error details
 */
export const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Created resource data
 */
export const sendCreated = (res, message, data) => {
  return sendSuccess(res, message, data, 201);
};

/**
 * Send a not found response (404)
 * @param {Object} res - Express response object
 * @param {String} message - Not found message
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404);
};

/**
 * Send an unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {String} message - Unauthorized message
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, 401);
};

/**
 * Send a forbidden response (403)
 * @param {Object} res - Express response object
 * @param {String} message - Forbidden message
 */
export const sendForbidden = (res, message = 'Forbidden action') => {
  return sendError(res, message, 403);
};

/**
 * Send a validation error response (422)
 * @param {Object} res - Express response object
 * @param {String} message - Validation error message
 * @param {Object} errors - Validation errors
 */
export const sendValidationError = (res, message = 'Validation error', errors) => {
  return sendError(res, message, 422, errors);
};

/**
 * Send a server error response (500)
 * @param {Object} res - Express response object
 * @param {String} message - Server error message
 */
export const sendServerError = (res, message = 'Internal server error') => {
  return sendError(res, message, 500);
}; 