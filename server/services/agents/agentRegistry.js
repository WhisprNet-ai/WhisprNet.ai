/**
 * Agent Registry
 * 
 * This registry defines all available agents and what data types they require.
 * Each agent should specify:
 * - required_metadata: Array of data types this agent requires to function
 * - optional_metadata: Array of data types this agent can use but doesn't require
 * - description: Brief description of what the agent does
 */
export const agentRegistry = {
  pulseAgent: {
    name: 'Pulse Agent',
    description: 'Analyzes communication patterns from Slack and email',
    required_metadata: ['communication_metadata'],
    optional_metadata: ['emoji_usage', 'channel_activity', 'message_frequency'],
    results_key: 'pulseResults'
  },
  intelAgent: {
    name: 'Intel Agent',
    description: 'Analyzes development patterns from GitHub and other tools',
    required_metadata: ['commit_activity', 'pr_lifecycle'],
    optional_metadata: ['issue_tracking', 'code_review'],
    results_key: 'intelResults'
  },
  sentinelAgent: {
    name: 'Sentinel Agent',
    description: 'Detects anomalies by combining insights from other agents',
    required_metadata: [],  // Can work with results from any agent
    optional_metadata: ['communication_metadata', 'commit_activity'],
    requires_agent_results: ['pulseAgent', 'intelAgent'],  // Needs at least one agent's results
    results_key: 'sentinelResults'
  },
  whisprAgent: {
    name: 'Whispr Agent',
    description: 'Generates actionable insights and recommendations',
    required_metadata: [],  // Doesn't directly consume metadata
    optional_metadata: [],
    requires_agent_results: ['sentinelAgent'],  // Always runs after sentinel
    results_key: 'whispers',
    is_final: true  // Always the last agent in the workflow
  }
  // Future agents can be added here
};

/**
 * Determine which agents are compatible with available metadata types
 * @param {Array} availableMetadataTypes - Array of available metadata types
 * @returns {Array} - Array of compatible agent IDs
 */
export const getCompatibleAgents = (availableMetadataTypes) => {
  const compatibleAgents = [];
  
  Object.entries(agentRegistry).forEach(([agentId, config]) => {
    // Check if all required metadata types are available
    const allRequiredAvailable = config.required_metadata.every(
      type => availableMetadataTypes.includes(type)
    );
    
    if (allRequiredAvailable) {
      compatibleAgents.push(agentId);
    }
  });
  
  return compatibleAgents;
};

/**
 * Check if an agent has the required data to run based on existing state
 * @param {Object} state - Current workflow state
 * @param {String} agentId - Agent ID to check
 * @param {Array} availableMetadataTypes - Available metadata types
 * @returns {Boolean} - Whether the agent can run
 */
export const canAgentRun = (state, agentId, availableMetadataTypes) => {
  const agent = agentRegistry[agentId];
  if (!agent) return false;
  
  // Check required metadata types
  const hasRequiredMetadata = agent.required_metadata.every(
    type => availableMetadataTypes.includes(type)
  );
  
  // Check if required agent results exist
  const hasRequiredResults = !agent.requires_agent_results || 
    agent.requires_agent_results.some(requiredAgentId => {
      const resultsKey = agentRegistry[requiredAgentId]?.results_key;
      return resultsKey && state[resultsKey];
    });
  
  return hasRequiredMetadata && hasRequiredResults;
};

/**
 * Build an optimal sequence of agents based on available metadata
 * @param {Array} availableMetadataTypes - Array of available metadata types
 * @returns {Array} - Ordered array of agent IDs to execute
 */
export const buildAgentWorkflowSequence = (availableMetadataTypes) => {
  const sequence = [];
  const compatibleAgents = getCompatibleAgents(availableMetadataTypes);
  
  // Add non-final agents first
  Object.entries(agentRegistry)
    .filter(([agentId, config]) => !config.is_final && compatibleAgents.includes(agentId))
    .forEach(([agentId]) => sequence.push(agentId));
  
  // Add final agents last
  Object.entries(agentRegistry)
    .filter(([agentId, config]) => config.is_final && compatibleAgents.includes(agentId))
    .forEach(([agentId]) => sequence.push(agentId));
  
  return sequence;
}; 