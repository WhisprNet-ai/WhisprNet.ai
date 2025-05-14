/**
 * Integration Registry
 * 
 * This registry defines all available integrations and what data types they provide.
 * Each integration should specify:
 * - metadata_types: Array of data type strings this integration provides
 * - metadataModel: MongoDB model for storing this integration's metadata
 * - requiresConfig: Boolean indicating if this integration needs configuration
 */
export const integrationRegistry = {
  slack: {
    name: 'Slack',
    metadata_types: ['communication_metadata', 'emoji_usage', 'channel_activity', 'message_frequency'],
    metadataModel: 'SlackMetadata',
    requiresConfig: true,
    configModel: 'SlackConfig',
    handlerPath: './slackMetadataService.js',
    handlerFunction: 'processSlackEventMetadata'
  },
  github: {
    name: 'GitHub',
    metadata_types: ['commit_activity', 'pr_lifecycle', 'issue_tracking', 'code_review'],
    metadataModel: 'GithubMetadata',
    requiresConfig: true,
    configModel: 'GithubConfig',
    handlerPath: './githubService.js',
    handlerFunction: 'getGithubMetadata'
  }
  // Future integrations can be added here
};

/**
 * Get the handler function for a given integration type
 * @param {String} integrationType - The integration type
 * @returns {Promise<Function>} - The handler function
 */
export const getIntegrationHandler = async (integrationType) => {
  const integration = integrationRegistry[integrationType];
  if (!integration) {
    throw new Error(`Unknown integration type: ${integrationType}`);
  }

  try {
    const module = await import(integration.handlerPath);
    return module[integration.handlerFunction];
  } catch (error) {
    console.error(`Error loading handler for ${integrationType}:`, error);
    throw error;
  }
};

/**
 * Get all metadata types provided by active integrations
 * @param {Array} activeIntegrations - Array of active integration objects with 'type' field
 * @returns {Array} - Array of available metadata types
 */
export const getAvailableMetadataTypes = (activeIntegrations) => {
  const availableTypes = new Set();
  
  activeIntegrations.forEach(integration => {
    const registryEntry = integrationRegistry[integration.type];
    if (registryEntry) {
      registryEntry.metadata_types.forEach(type => availableTypes.add(type));
    }
  });
  
  return Array.from(availableTypes);
};

/**
 * Check if a specific metadata type is available from active integrations
 * @param {Array} activeIntegrations - Array of active integration objects
 * @param {String} metadataType - The metadata type to check for
 * @returns {Boolean} - Whether the metadata type is available
 */
export const hasMetadataType = (activeIntegrations, metadataType) => {
  return activeIntegrations.some(integration => {
    const registryEntry = integrationRegistry[integration.type];
    return registryEntry && registryEntry.metadata_types.includes(metadataType);
  });
};

/**
 * Get active integrations for an organization
 * @param {String} organizationId - The organization ID
 * @returns {Promise<Array>} - Array of active integration objects
 */
export const getActiveIntegrationsForOrg = async (organizationId) => {
  try {
    const activeIntegrations = [];
    
    // Import models conditionally to avoid circular dependencies
    const mongoose = await import('mongoose');
    
    // Check each integration in the registry
    for (const [integrationType, config] of Object.entries(integrationRegistry)) {
      if (config.requiresConfig && config.configModel) {
        // Get the model dynamically
        const ConfigModel = mongoose.model(config.configModel);
        
        // Check if this organization has an active configuration
        const integrationConfig = await ConfigModel.findOne({
          organization: organizationId,
          status: 'active'
        });
        
        if (integrationConfig) {
          activeIntegrations.push({
            type: integrationType,
            id: integrationConfig._id,
            name: config.name,
            metadata_types: config.metadata_types
          });
        }
      }
    }
    
    return activeIntegrations;
  } catch (error) {
    console.error('Error getting active integrations:', error);
    return [];
  }
}; 