/**
 * Agent Utilities
 * Shared utilities for all agent types
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatMistralAI } from '@langchain/mistralai';
import AgentSession from '../../models/AgentSession.js';
import { ChatOllama } from '@langchain/community/chat_models/ollama';

/**
 * Create a LLM instance based on model name
 * @param {String} modelName - Model name to use (mistral or gpt3.5/4)
 * @returns {Object} - LLM instance
 */
export const createLLM = (modelName) => {
  // Use local Ollama for mistral if no API key is provided
  if (!modelName || modelName === 'mistral') {
    // Check if MISTRAL_API_KEY exists
    if (process.env.MISTRAL_API_KEY) {
      return new ChatMistralAI({
        apiKey: process.env.MISTRAL_API_KEY,
        modelName: 'mistral-medium',
        temperature: 0.2,
        topP: 0.2,
      });
    } else {
      // If no API key, use local Ollama instead
      return new ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_DEFAULT_MODEL || 'mistral',
        temperature: 0.2,
      });
    }
  } else if (modelName === 'mistral-large') {
    // Check if MISTRAL_API_KEY exists for mistral-large
    if (process.env.MISTRAL_API_KEY) {
      return new ChatMistralAI({
        apiKey: process.env.MISTRAL_API_KEY,
        modelName: 'mistral-large-latest',
        temperature: 0.1,
        topP: 0.1,
      });
    } else {
      // Fallback to local Ollama
      console.warn('Mistral API key missing, falling back to local Ollama for mistral-large');
      return new ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_DEFAULT_MODEL || 'mistral',
        temperature: 0.1,
      });
    }
  } else if (modelName.includes('gpt-4')) {
    return new ChatOpenAI({
      modelName: modelName,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.1,
    });
  } else if (modelName.includes('gpt-3.5')) {
    return new ChatOpenAI({
      modelName: modelName,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    });
  } else {
    console.warn(`Unknown model name: ${modelName}, falling back to local Ollama`);
    return new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_DEFAULT_MODEL || 'mistral',
      temperature: 0.2,
    });
  }
};

/**
 * Log agent execution step
 * @param {String} agentName - Agent name
 * @param {String} stage - Stage name
 * @param {String} sessionId - Session ID
 * @param {Object} data - Additional data
 */
export const logAgentStep = async (agentName, stage, sessionId, data = {}) => {
  if (!sessionId) {
    console.warn(`[${agentName}] Cannot log step without sessionId`);
    return;
  }
  
  try {
    // Format the log message
    const logMessage = `${stage} - ${Object.keys(data).length > 0 ? JSON.stringify(data) : 'No data'}`;
    
    console.log(`[${agentName}:${sessionId}] ${stage}`);
    
    // Add log entry to agent session
    await AgentSession.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          logs: {
            level: stage.includes('ERROR') ? 'error' : 'info',
            message: logMessage,
            data
          }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    console.error(`Error logging agent step: ${error.message}`);
  }
};

/**
 * Create fallback result objects for different agent types
 * @param {String} agentName - Agent name
 * @param {Error} error - Optional error object
 * @returns {Object} - Fallback result structure
 */
export const createFallbackResult = (agentName, error = null) => {
  const errorMsg = error ? ` (Error: ${error.message})` : '';
  console.warn(`Creating fallback result for ${agentName}${errorMsg}`);
  
  switch(agentName) {
    case 'sentinel':
      return { anomalies: [] };
    case 'whispr':
      return { whispers: [] };
    case 'intel':
      return { patterns: [], insights: [] };
    case 'pulse':
    default:
      return { patterns: [], insights: [] };
  }
};

/**
 * Try to parse JSON with error handling
 * @param {String} text - Text to parse as JSON
 * @param {Object} defaultValue - Default value to return if parsing fails
 * @returns {Object} - Parsed JSON or default value
 */
export const tryParseJSON = (text, defaultValue = {}) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    return defaultValue;
  }
}; 