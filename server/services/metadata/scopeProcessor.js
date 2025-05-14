import InsightScope from '../../models/InsightScope.js';
import logger from '../../utils/logger.js';

const scopeLogger = logger.child('scopeProcessor');

/**
 * Check if metadata item is in any manager's scope
 * @param {Object} metadataItem - The metadata to check 
 * @param {String} integration - Integration type (slack, teams, etc)
 * @param {String} organizationId - Organization ID
 * @returns {Promise<Array>} - Array of matching scope IDs and manager IDs
 */
export const matchScopeForMetadata = async (metadataItem, integration, organizationId) => {
  try {
    const matches = [];
    
    // Extract identifiers based on integration type
    let identifiers = [];
    
    if (integration === 'slack') {
      // For Slack metadata
      if (metadataItem.user) identifiers.push({ id: metadataItem.user, type: 'user' });
      if (metadataItem.channel) identifiers.push({ id: metadataItem.channel, type: 'channel' });
    } else if (integration === 'teams') {
      // For MS Teams metadata
      if (metadataItem.userId) identifiers.push({ id: metadataItem.userId, type: 'user' });
      if (metadataItem.channelId) identifiers.push({ id: metadataItem.channelId, type: 'channel' });
    } else if (integration === 'discord') {
      // For Discord metadata
      if (metadataItem.userId) identifiers.push({ id: metadataItem.userId, type: 'user' });
      if (metadataItem.channelId) identifiers.push({ id: metadataItem.channelId, type: 'channel' });
    } else if (integration === 'gmail') {
      // For Gmail metadata
      if (metadataItem.emailAddress) identifiers.push({ id: metadataItem.emailAddress, type: 'user' });
    } else if (integration === 'github') {
      // For GitHub metadata
      if (metadataItem.userId) identifiers.push({ id: metadataItem.userId, type: 'user' });
      if (metadataItem.repoId) identifiers.push({ id: metadataItem.repoId, type: 'group' });
    }
    
    // No identifiers to match
    if (identifiers.length === 0) {
      scopeLogger.debug('No identifiers found to match in metadata', { 
        integration, 
        metadataType: metadataItem.type || 'unknown' 
      });
      return matches;
    }
    
    scopeLogger.debug('Matching scope for identifiers', { 
      integration, 
      identifiers: identifiers.map(i => i.type) 
    });
    
    // Find all scopes that include any of these identifiers
    for (const { id, type } of identifiers) {
      const matchingScopes = await InsightScope.find({
        integration,
        organizationId,
        isActive: true,
        'scopeItems.itemId': id,
        'scopeItems.itemType': type
      }).select('_id managerId organizationId');
      
      matches.push(...matchingScopes.map(scope => ({
        scopeId: scope._id,
        managerId: scope.managerId,
        organizationId: scope.organizationId
      })));
    }
    
    // Remove duplicates by scopeId
    const uniqueMatches = [...new Map(matches.map(m => [m.scopeId.toString(), m])).values()];
    
    scopeLogger.debug('Found scope matches', { 
      count: uniqueMatches.length, 
      integration 
    });
    
    return uniqueMatches;
  } catch (error) {
    scopeLogger.error('Error matching scope for metadata', { 
      error: error.message, 
      integration 
    });
    return [];
  }
};

/**
 * Tag metadata with scope information
 * @param {Object} metadataItem - The metadata to tag
 * @param {String} integration - Integration type
 * @param {String} organizationId - Organization ID
 * @returns {Object} - Metadata with scope information
 */
export const tagMetadataWithScope = async (metadataItem, integration, organizationId) => {
  try {
    const matches = await matchScopeForMetadata(metadataItem, integration, organizationId);
    
    // Add scope information to metadata
    if (matches.length > 0) {
      metadataItem.scopeMatches = matches;
      scopeLogger.debug('Tagged metadata with scope information', { 
        metadataId: metadataItem._id, 
        matchCount: matches.length 
      });
    }
    
    return metadataItem;
  } catch (error) {
    scopeLogger.error('Error tagging metadata with scope', { 
      error: error.message, 
      integration 
    });
    return metadataItem;
  }
};

/**
 * Create whispers for each matching scope
 * @param {Object} whisperData - Base whisper data
 * @param {Object} metadata - Metadata item with scope matches
 * @param {String} integration - Integration type
 * @param {Function} createFn - Function to create a whisper
 * @returns {Promise<Array>} - Created whispers
 */
export const createScopedWhispers = async (whisperData, metadata, integration, createFn) => {
  try {
    const whispers = [];
    
    // If no scope matches, create a single org-wide whisper
    if (!metadata.scopeMatches || metadata.scopeMatches.length === 0) {
      const whisper = await createFn(whisperData);
      whispers.push(whisper);
      return whispers;
    }
    
    // Create a whisper for each scope match
    for (const match of metadata.scopeMatches) {
      // Add scope information to whisper data
      const scopedWhisperData = {
        ...whisperData,
        scopeInfo: {
          managerId: match.managerId,
          scopeId: match.scopeId,
          integration,
          sourceItems: getSourceItemsFromMetadata(metadata, integration)
        }
      };
      
      // Create and store the whisper
      const whisper = await createFn(scopedWhisperData);
      whispers.push(whisper);
    }
    
    scopeLogger.debug('Created scoped whispers', { 
      count: whispers.length, 
      integration 
    });
    
    return whispers;
  } catch (error) {
    scopeLogger.error('Error creating scoped whispers', { 
      error: error.message, 
      integration 
    });
    throw error;
  }
};

/**
 * Extract source items from metadata based on integration type
 * @param {Object} metadata - Metadata item
 * @param {String} integration - Integration type
 * @returns {Array} - Source items
 */
const getSourceItemsFromMetadata = (metadata, integration) => {
  const items = [];
  
  if (integration === 'slack') {
    if (metadata.user) items.push({ itemId: metadata.user, itemType: 'user' });
    if (metadata.channel) items.push({ itemId: metadata.channel, itemType: 'channel' });
  } else if (integration === 'teams') {
    if (metadata.userId) items.push({ itemId: metadata.userId, itemType: 'user' });
    if (metadata.channelId) items.push({ itemId: metadata.channelId, itemType: 'channel' });
  } else if (integration === 'discord') {
    if (metadata.userId) items.push({ itemId: metadata.userId, itemType: 'user' });
    if (metadata.channelId) items.push({ itemId: metadata.channelId, itemType: 'channel' });
  }
  // Add other integrations as needed
  
  return items;
}; 