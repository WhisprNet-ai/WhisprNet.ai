/**
 * Agent Logging Service
 * 
 * This module has been refactored - the functionality is now in agents/utils.js.
 * This file is maintained for backward compatibility.
 */

import { logAgentStep as logAgentStepImpl } from '../agents/utils.js';

/**
 * Log an agent execution step (Re-exported from agents/utils.js)
 * @param {String} agentName - Agent name
 * @param {String} stage - Stage name
 * @param {String} sessionId - Session ID
 * @param {Object} data - Additional data
 */
export const logAgentStep = async (agentName, stage, sessionId, data = {}) => {
  // Forward to the implementation in utils.js
  return logAgentStepImpl(agentName, stage, sessionId, data);
}; 