/**
 * Async handler to wrap controller functions
 * This is kept for backward compatibility - new code should use the controller() utility
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Middleware function with error handling
 */
import { controller } from '../utils/controllerUtils.js';

// For backward compatibility with existing code
export const asyncHandler = (fn) => controller(fn);

// Default export for older imports
export default asyncHandler; 