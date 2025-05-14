import Whisper from '../../models/Whisper.js';
import { createScopedWhispers } from './scopeProcessor.js';
import logger from '../../utils/logger.js';

const whisperLogger = logger.child('whisperGenerator');

/**
 * Generate whispers from processed metadata
 * @param {Object} metadata - Processed metadata with scope information
 * @param {Object} whisperData - Base whisper data (title, content, etc.)
 * @param {String} integration - Integration type
 * @returns {Promise<Array>} - Array of created whispers
 */
export const generateWhispers = async (metadata, whisperData, integration) => {
  try {
    // Basic metadata validation
    if (!metadata || !metadata.organizationId) {
      whisperLogger.error('Invalid metadata provided', { integration });
      throw new Error('Invalid metadata provided: missing organizationId');
    }
    
    // Ensure whisper data has required fields
    const baseWhisperData = {
      ...whisperData,
      organizationId: metadata.organizationId,
      source: 'agent',
      metadata: {
        generatedAt: new Date(),
        source: integration,
        ...(whisperData.metadata || {})
      }
    };
    
    // Create whisper creation function
    const createWhisper = async (data) => {
      const whisper = new Whisper(data);
      await whisper.save();
      return whisper;
    };
    
    // Generate whispers with scope processing
    const whispers = await createScopedWhispers(
      baseWhisperData,
      metadata,
      integration,
      createWhisper
    );
    
    whisperLogger.info(`Created ${whispers.length} whispers from metadata`, {
      integration,
      whisperIds: whispers.map(w => w.whisperId)
    });
    
    return whispers;
  } catch (error) {
    whisperLogger.error('Error generating whispers', {
      error: error.message,
      integration
    });
    throw error;
  }
};

/**
 * Batch generate whispers from multiple metadata items
 * @param {Array} metadataItems - Array of processed metadata items
 * @param {Function} insightFunction - Function that generates whisper data from metadata
 * @param {String} integration - Integration type
 * @returns {Promise<Array>} - Array of created whispers
 */
export const batchGenerateWhispers = async (metadataItems, insightFunction, integration) => {
  const whispers = [];
  
  for (const metadata of metadataItems) {
    try {
      // Generate whisper data using the provided insight function
      const whisperData = await insightFunction(metadata);
      
      if (whisperData) {
        // Create whispers with scope processing
        const createdWhispers = await generateWhispers(metadata, whisperData, integration);
        whispers.push(...createdWhispers);
      }
    } catch (error) {
      whisperLogger.error('Error in batch whisper generation', {
        error: error.message,
        integration,
        metadataId: metadata._id
      });
      // Continue processing other items
    }
  }
  
  return whispers;
};

export default {
  generateWhispers,
  batchGenerateWhispers
}; 