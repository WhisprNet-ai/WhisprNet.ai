import { tagMetadataWithScope } from './scopeProcessor.js';
import SlackMetadata from '../../models/SlackMetadata.js';
import GithubMetadata from '../../models/GithubMetadata.js';
import logger from '../../utils/logger.js';

const metadataLogger = logger.child('metadataProcessor');

/**
 * Process newly received metadata and tag with scope information
 * @param {Object} metadata - Raw metadata object
 * @param {String} integration - Integration type (slack, github, etc)
 * @param {String} organizationId - Organization ID
 * @returns {Promise<Object>} - Tagged metadata
 */
export const processMetadata = async (metadata, integration, organizationId) => {
  try {
    metadataLogger.debug('Processing metadata', { integration, organizationId });
    
    // Tag with scope information
    const taggedMetadata = await tagMetadataWithScope(metadata, integration, organizationId);
    
    // Store in appropriate collection
    const savedMetadata = await storeMetadata(taggedMetadata, integration);
    
    metadataLogger.debug('Metadata processed and stored', { 
      integration, 
      metadataId: savedMetadata._id,
      hasScopes: savedMetadata.scopeMatches && savedMetadata.scopeMatches.length > 0 
    });
    
    return savedMetadata;
  } catch (error) {
    metadataLogger.error('Error processing metadata', { 
      error: error.message, 
      integration 
    });
    throw error;
  }
};

/**
 * Store metadata in the appropriate collection
 * @param {Object} metadata - Tagged metadata
 * @param {String} integration - Integration type
 * @returns {Promise<Object>} - Stored metadata document
 */
const storeMetadata = async (metadata, integration) => {
  switch (integration) {
    case 'slack':
      return await SlackMetadata.create(metadata);
    case 'github':
      return await GithubMetadata.create(metadata);
    default:
      throw new Error(`Unsupported integration: ${integration}`);
  }
};

/**
 * Batch process metadata for scope tagging
 * @param {Array} metadataItems - Array of metadata items
 * @param {String} integration - Integration type
 * @param {String} organizationId - Organization ID
 * @returns {Promise<Array>} - Array of tagged metadata
 */
export const batchProcessMetadata = async (metadataItems, integration, organizationId) => {
  metadataLogger.debug(`Batch processing ${metadataItems.length} metadata items`, {
    integration,
    organizationId
  });
  
  const taggedItems = [];
  
  for (const item of metadataItems) {
    try {
      const taggedItem = await tagMetadataWithScope(item, integration, organizationId);
      taggedItems.push(taggedItem);
    } catch (error) {
      metadataLogger.error('Error tagging metadata item', {
        error: error.message,
        integration,
        item: item._id || 'new-item'
      });
      // Add the original item anyway
      taggedItems.push(item);
    }
  }
  
  return taggedItems;
};

export default {
  processMetadata,
  batchProcessMetadata
}; 