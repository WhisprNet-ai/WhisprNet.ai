import { getActiveIntegrationsForOrg, getAvailableMetadataTypes } from '../integrations/integrationRegistry.js';
import { buildAgentWorkflowSequence, canAgentRun, agentRegistry } from './agentRegistry.js';
import { v4 as uuidv4 } from 'uuid';
import AgentSession from '../../models/AgentSession.js';

// Import the createAgentWorkflow from our modular agent implementation
import { createAgentWorkflow } from './agentGraph.js';

// Helper function for logging agent steps
import { logAgentStep } from './utils.js';

// For Slack whisper delivery
import { deliverSlackInsight, sendSlackChannelMessage } from '../slack/delivery.js';

/**
 * Create a dynamic agent workflow based on available integrations
 * @param {String} organizationId - The organization ID
 * @returns {Object} - The workflow object with invoke method
 */
export const createDynamicAgentWorkflow = async (organizationId, modelName = 'mistral') => {
  console.log(`[LANGGRAPH] Creating dynamic agent workflow for org ${organizationId} with model: ${modelName}`);
  
  // 1. Get active integrations for this organization
  const activeIntegrations = await getActiveIntegrationsForOrg(organizationId);
  console.log(`[LANGGRAPH] Active integrations for org ${organizationId}:`, activeIntegrations.map(i => i.type));
  
  // 2. Determine available metadata types
  const availableMetadataTypes = getAvailableMetadataTypes(activeIntegrations);
  console.log(`[LANGGRAPH] Available metadata types:`, availableMetadataTypes);
  
  // 3. Build optimal agent sequence
  const agentSequence = buildAgentWorkflowSequence(availableMetadataTypes);
  console.log(`[LANGGRAPH] Agent sequence:`, agentSequence);
  
  // Get the full agent workflow that includes all agents
  const fullWorkflow = createAgentWorkflow(modelName);
  
  // Return workflow object
  return {
    agentSequence,
    availableMetadataTypes,
    activeIntegrations,
    invoke: async (initialState) => {
      try {
        const { sessionId } = initialState;
        
        // Log workflow start
        console.log(`[LANGGRAPH] Starting dynamic workflow for session ${sessionId}`);
        await logAgentStep('workflow', 'WORKFLOW_START', sessionId, { 
          modelName,
          metadataCount: initialState.metadata.length,
          agentSequence,
          availableMetadataTypes
        });
        
        // For our dynamic implementation, we'll use the full workflow but track which agents should be skipped
        initialState.dynamicAgentSequence = agentSequence;
        initialState.availableMetadataTypes = availableMetadataTypes;
        
        // Execute the workflow with our extended state
        const result = await fullWorkflow.invoke(initialState);
        
        // Log workflow completion
        await logAgentStep('workflow', 'WORKFLOW_COMPLETE', sessionId, {
          totalAgents: agentSequence.length,
          whisperCount: result.whispers?.length || 0
        });
        
        return result;
      } catch (error) {
        console.error("Error in dynamic workflow execution:", error);
        await logAgentStep('workflow', 'WORKFLOW_ERROR', initialState.sessionId, { 
          error: error.message,
          stack: error.stack 
        });
        
        return {
          ...initialState,
          errors: [...(initialState.errors || []), {
            agent: 'workflow',
            message: error.message
          }],
          completed: true
        };
      }
    }
  };
};

/**
 * Get empty results structure for an agent
 * @param {String} agentId - Agent ID
 * @returns {Object} - Empty results structure
 */
const getEmptyResultsForAgent = (agentId) => {
  switch (agentId) {
    case 'pulseAgent':
      return { patterns: [], insights: [] };
    case 'intelAgent':
      return { patterns: [], insights: [] };
    case 'sentinelAgent':
      return { anomalies: [] };
    case 'whisprAgent':
      return { whispers: [] };
    default:
      return {};
  }
};

/**
 * Run dynamic agent workflow for an organization
 * @param {String} organizationId - The organization ID
 * @param {Array} metadata - Array of metadata objects
 * @returns {Object} - Result of the workflow
 */
export const runDynamicAgentWorkflow = async (organizationId, metadata) => {
  try {
    // Create a new session ID
    const sessionId = `sess_${uuidv4()}`;
    console.log(`[LANGGRAPH] Starting new dynamic agent workflow session: ${sessionId}`);
    
    // Create the agent session in the database
    const agentSession = new AgentSession({
      organizationId,
      agentType: 'whispr',
      sessionId,
      status: 'running',
      startTime: new Date(),
      metadata: {
        integrations: metadata.map(m => m.source).filter((v, i, a) => a.indexOf(v) === i), // Unique sources
        modelName: process.env.LLM_MODEL_NAME || 'mistral'
      },
      inputs: {
        metadata
      }
    });
    
    await agentSession.save();
    console.log(`[LANGGRAPH] Created agent session record in database: ${sessionId}`);
    
    // Get model name from env
    const modelName = process.env.LLM_MODEL_NAME || 'mistral';
    
    // Create the dynamic workflow
    const workflow = await createDynamicAgentWorkflow(organizationId, modelName);
    
    // Tag metadata with types based on source
    const typedMetadata = metadata.map(item => {
      const sourceType = item.source?.split('_')[0] || item.source; // Extract base source type
      
      // Add metadata_type based on source if not already present
      if (!item.metadata_type) {
        switch (sourceType) {
          case 'slack':
            item.metadata_type = 'communication_metadata';
            break;
          case 'github':
            if (item.eventType === 'push' || item.eventType === 'commit')
              item.metadata_type = 'commit_activity';
            else if (item.eventType === 'pull_request')
              item.metadata_type = 'pr_lifecycle';
            else if (item.eventType === 'issue')
              item.metadata_type = 'issue_tracking';
            else
              item.metadata_type = 'development_activity';
            break;
        }
      }
      
      return item;
    });
    
    // Initialize the state
    const initialState = {
      sessionId,
      organizationId,
      metadata: typedMetadata,
      availableMetadataTypes: workflow.availableMetadataTypes,
      startTime: Date.now(),
      errors: []
    };
    
    // Run the workflow
    console.log(`[LANGGRAPH] Executing dynamic workflow for session: ${sessionId}`);
    const startTime = Date.now();
    const { completed = false, whispers = [], errors = [] } = await workflow.invoke(initialState);
    const duration = Date.now() - startTime;
    
    console.log(`[LANGGRAPH] Dynamic workflow execution completed in ${duration}ms with ${whispers.length} whispers`);
    
    // Update session status
    await AgentSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          status: completed ? (errors.length > 0 ? 'completed_with_errors' : 'completed') : 'failed',
          endTime: new Date(),
          'metadata.agentSequence': workflow.agentSequence,
          'metadata.activeIntegrations': workflow.activeIntegrations.map(i => i.type)
        }
      }
    );
    
    // NOTE: Whisper delivery code was removed from here to prevent duplicate deliveries
    // The delivery functionality is already implemented in agentGraph.js's handleWhisperDelivery() function
    // This fix prevents the same whispers from being delivered twice to Slack
    
    return {
      success: completed && errors.length === 0,
      sessionId,
      whisperCount: whispers.length,
      whispers: whispers.map(w => ({
        title: w.content?.title || w.title || 'Team Insight',
        category: w.category,
        priority: w.priority
      })),
      errors,
      agentSequence: workflow.agentSequence
    };
  } catch (error) {
    console.error('Error running dynamic agent workflow:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 