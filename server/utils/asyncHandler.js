/**
 * Async handler to avoid try-catch blocks in controllers
 * @param {Function} fn - The async function to execute
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 