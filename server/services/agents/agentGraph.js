/**
 * Agent Graph
 * Orchestrates the flow between different agent types
 */

import AgentSession from '../../models/AgentSession.js';
import { logAgentStep } from './utils.js';
import { createPulseAgent } from './pulseAgent.js';
import { createIntelAgent } from './intelAgent.js';
import { createSentinelAgent } from './sentinelAgent.js';
import { createWhisprAgent } from './whisprAgent.js';
import { deliverSlackInsight, sendSlackChannelMessage } from '../slack/delivery.js';
import { startAgentSpan, endSpan, endSpanWithError, getCurrentTraceId } from '../telemetry/tracer.js';
import Whisper from '../../models/Whisper.js';

/**
 * Map Whisper priority (1-5) to string priority
 * @param {number|string} whisperPriority - Numeric priority from Whisper (1-5)
 * @returns {string} - Priority string value
 */
function mapPriority(whisperPriority) {
  // Convert to number if it's a string
  const priority = typeof whisperPriority === 'string' ? parseInt(whisperPriority, 10) : whisperPriority;
  
  // Map numeric priority to string values
  switch (priority) {
    case 1:
      return 'critical';
    case 2:
      return 'high';
    case 3:
      return 'medium';
    case 4:
    case 5:
      return 'low';
    default:
      return 'medium'; // Default fallback
  }
}

/**
 * Map Whisper category to compatible categories
 * @param {string} whisperCategory - Category from Whisper
 * @returns {string} - Mapped category value
 */
function mapCategory(whisperCategory) {
  // Map Whisper categories
  switch (whisperCategory) {
    case 'improvement':
    case 'optimization':
      return 'suggestion';
    case 'health':
      return 'warning';
    case 'collaboration':
    case 'recognition':
      return 'insight';
    default:
      return 'insight'; // Default fallback
  }
}

/**
 * Create the agent workflow graph
 * @param {String} modelName - Model name to use for agents
 * @returns {Object} - Workflow object with invoke method
 */
export const createAgentWorkflow = (modelName = 'mistral') => {
  console.log(`[LANGGRAPH] Creating agent workflow with model: ${modelName}`);
  
  // Create the individual agents
  const pulseAgent = createPulseAgent(modelName);
  const intelAgent = createIntelAgent(modelName);
  const sentinelAgent = createSentinelAgent(modelName);
  const whisprAgent = createWhisprAgent(modelName);
  
  // Simple sequential workflow implementation
  return {
    invoke: async (initialState) => {
      // Create the root span for the entire workflow
      const rootSpan = startAgentSpan('supervisor', {
        'workflow.session_id': initialState.sessionId,
        'workflow.organization_id': initialState.organizationId,
        'workflow.model_name': modelName,
        'workflow.metadata_count': initialState.metadata?.length || 0
      });
      
      try {
        const { sessionId, dynamicAgentSequence, availableMetadataTypes } = initialState;
        
        console.log(`[LANGGRAPH] Starting workflow execution for session ${sessionId}`);
        await logAgentStep('workflow', 'WORKFLOW_START', sessionId, { 
          modelName,
          metadataCount: initialState.metadata.length,
          dynamicMode: !!dynamicAgentSequence,
          traceId: getCurrentTraceId() // Add the trace ID to the logs
        });
        
        let currentState = initialState;
        
        // Run PulseAgent
        const shouldRunPulseAgent = !dynamicAgentSequence || 
            (dynamicAgentSequence && dynamicAgentSequence.includes('pulseAgent'));
        
        if (shouldRunPulseAgent) {
        await logAgentStep('workflow', 'NODE_TRANSITION', sessionId, {
            from: 'start',
            to: 'pulseAgent'
          });
          
          // Create span for PulseAgent
          const pulseSpan = startAgentSpan('pulseAgent', {
            'agent.session_id': sessionId,
            'agent.metadata_count': initialState.metadata.length
          });
          
          try {
            currentState = await pulseAgent(currentState);
            endSpan(pulseSpan, {
              'result.status': 'success',
              'result.pattern_count': currentState.pulseResults?.patterns?.length || 0,
              'result.insight_count': currentState.pulseResults?.insights?.length || 0
            });
          } catch (error) {
            endSpanWithError(pulseSpan, error);
            throw error;
          }
        } else {
          await logAgentStep('workflow', 'NODE_SKIPPED', sessionId, {
            node: 'pulseAgent',
            reason: 'Not in dynamic sequence or insufficient metadata'
          });
        }
        
        // Run IntelAgent
        const shouldRunIntelAgent = !dynamicAgentSequence || 
            (dynamicAgentSequence && dynamicAgentSequence.includes('intelAgent'));
        
        if (shouldRunIntelAgent) {
        await logAgentStep('workflow', 'NODE_TRANSITION', sessionId, {
            from: 'pulseAgent',
            to: 'intelAgent'
          });
          
          // Create span for IntelAgent
          const intelSpan = startAgentSpan('intelAgent', {
            'agent.session_id': sessionId,
            'agent.has_pulse_results': !!currentState.pulseResults
          });
          
          try {
            currentState = await intelAgent(currentState);
            endSpan(intelSpan, {
              'result.status': 'success',
              'result.signal_count': currentState.intelResults?.signals?.length || 0,
              'result.cluster_count': currentState.intelResults?.clusters?.length || 0
            });
          } catch (error) {
            endSpanWithError(intelSpan, error);
            throw error;
          }
        } else {
          await logAgentStep('workflow', 'NODE_SKIPPED', sessionId, {
            node: 'intelAgent',
            reason: 'Not in dynamic sequence or insufficient metadata'
          });
        }
        
        // Run SentinelAgent
        const shouldRunSentinelAgent = !dynamicAgentSequence || 
            (dynamicAgentSequence && dynamicAgentSequence.includes('sentinelAgent'));
        
        if (shouldRunSentinelAgent) {
        await logAgentStep('workflow', 'NODE_TRANSITION', sessionId, {
            from: 'intelAgent',
            to: 'sentinelAgent'
          });
          
          // Create span for SentinelAgent
          const sentinelSpan = startAgentSpan('sentinelAgent', {
            'agent.session_id': sessionId,
            'agent.has_intel_results': !!currentState.intelResults
          });
          
          try {
            currentState = await sentinelAgent(currentState);
            endSpan(sentinelSpan, {
              'result.status': 'success',
              'result.approved_count': currentState.sentinelResults?.approved?.length || 0,
              'result.rejected_count': currentState.sentinelResults?.rejected?.length || 0
            });
          } catch (error) {
            endSpanWithError(sentinelSpan, error);
            throw error;
          }
        } else {
          await logAgentStep('workflow', 'NODE_SKIPPED', sessionId, {
            node: 'sentinelAgent',
            reason: 'Not in dynamic sequence or insufficient inputs'
          });
        }
        
        // Run WhisprAgent
        const shouldRunWhisprAgent = !dynamicAgentSequence || 
            (dynamicAgentSequence && dynamicAgentSequence.includes('whisprAgent'));
        
        if (shouldRunWhisprAgent) {
        await logAgentStep('workflow', 'NODE_TRANSITION', sessionId, {
            from: 'sentinelAgent',
            to: 'whisprAgent'
          });
          
          // Create span for WhisprAgent
          const whisprSpan = startAgentSpan('whisprAgent', {
            'agent.session_id': sessionId,
            'agent.has_sentinel_results': !!currentState.sentinelResults
          });
          
          try {
            currentState = await whisprAgent(currentState);
            endSpan(whisprSpan, {
              'result.status': 'success',
              'result.whisper_count': currentState.whispers?.length || 0
            });
          } catch (error) {
            endSpanWithError(whisprSpan, error);
            throw error;
          }
        } else {
          await logAgentStep('workflow', 'NODE_SKIPPED', sessionId, {
            node: 'whisprAgent',
            reason: 'Not in dynamic sequence'
          });
        }
        
        // Mark workflow as completed
        await logAgentStep('workflow', 'WORKFLOW_COMPLETE', sessionId, {
          totalDurationMs: Date.now() - initialState.startTime,
          whisperCount: currentState.whispers?.length || 0,
          traceId: getCurrentTraceId()
        });
        
        // Add delivery phase if we have whispers and there was no error in workflow
        if (currentState.completed && currentState.whispers && currentState.whispers.length > 0 
            && (!currentState.errors || currentState.errors.length === 0)) {
          await handleWhisperDelivery(currentState);
        }
        
        // Update all whispers with the trace ID
        const traceId = getCurrentTraceId();
        if (traceId && currentState.whispers && currentState.whispers.length > 0) {
          for (const whisper of currentState.whispers) {
            if (whisper._id) {
              await Whisper.findByIdAndUpdate(whisper._id, {
                'metadata.traceId': traceId
              });
            }
          }
        }
        
        // End the root span with success
        endSpan(rootSpan, {
          'workflow.whisper_count': currentState.whispers?.length || 0,
          'workflow.duration_ms': Date.now() - initialState.startTime,
          'workflow.completed': true,
          'workflow.has_errors': currentState.errors?.length > 0 || false
        });
        
        return currentState;
      } catch (error) {
        console.error("Error in workflow execution:", error);
        await logAgentStep('workflow', 'WORKFLOW_ERROR', initialState.sessionId, { 
          error: error.message,
          stack: error.stack 
        });
        
        // End the root span with error
        endSpanWithError(rootSpan, error, {
          'workflow.error': error.message,
          'workflow.session_id': initialState.sessionId
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
 * Handle whisper delivery phase
 * @param {Object} state - Current workflow state
 */
async function handleWhisperDelivery(state) {
  const { sessionId, organizationId, whispers } = state;
  
  console.log(`[LANGGRAPH] Starting delivery phase for ${whispers.length} whispers`);
    await logAgentStep('deliveryPhase', 'DELIVERY_START', sessionId, { 
      whisperCount: whispers.length,
    hasErrors: state.errors?.length > 0 || false
    });
    
      for (const [index, whisper] of whispers.entries()) {
    // Get or derive the message from whatever data we have
    const message = whisper.content?.message || 
      whisper.message || 
      `${whisper.title || 'Insight'}: ${whisper.description || 'Team pattern identified.'}`;
    
        // Prepare whisper data for Slack
        const whisperData = {
      title: whisper.title || whisper.content?.title || 'Team Insight',
      message: message,
      suggestedActions: whisper.content?.suggestedActions || whisper.suggestedActions || []
    };
    
    console.log(`[LANGGRAPH] Preparing to deliver whisper #${index+1}: ${whisperData.title}`);
        await logAgentStep('deliveryPhase', `SENDING_ADMIN_DM_${index+1}`, sessionId, {
      whisperTitle: whisperData.title,
          deliveryType: 'admin_dm'
        });
        
        try {
      // Send whisper to Slack admin as DM
      console.log(`[LANGGRAPH] Calling deliverSlackInsight for whisper #${index+1}`);
          const result = await deliverSlackInsight(organizationId, whisperData);
          
          // Update whisper delivery status
          if (result.success) {
        console.log(`[LANGGRAPH] Successfully delivered whisper #${index+1} to ${result.channel}`);
            await logAgentStep('deliveryPhase', `ADMIN_DM_DELIVERED_${index+1}`, sessionId, {
              channel: result.channel,
              messageId: result.messageId,
              targetUser: 'admin'
            });
            
        if (whisper._id) {
          try {
            // Update the existing Whisper record with delivery information
            await Whisper.findByIdAndUpdate(whisper._id, {
              status: 'delivered',
              delivered: true,
              deliveredAt: new Date(),
              channel: result.channel || 'admin_dm',
              // Set mapped category and priority for compatibility
              priorityString: mapPriority(whisper.priority),
              // Set message directly for compatibility
              message: message,
              // Set suggested actions directly for compatibility
              suggestedActions: whisperData.suggestedActions,
              // Ensure organization is set (for queries that check both fields)
              organization: organizationId
            });
            
            console.log(`[LANGGRAPH] Updated whisper record with delivery information`);
          } catch (updateError) {
            console.error('[LANGGRAPH] Error updating whisper:', updateError.message);
          }
        }
          } else {
        console.error(`[LANGGRAPH] Failed to deliver whisper #${index+1}: ${result.error}`);
            await logAgentStep('deliveryPhase', `ADMIN_DM_FAILED_${index+1}`, sessionId, {
              error: result.error
            });
            
            // Fallback to regular channel delivery if admin DM fails
            console.log(`[LANGGRAPH] Admin DM delivery failed, attempting fallback to general channel for whisper #${index+1}`);
            await logAgentStep('deliveryPhase', `ATTEMPTING_FALLBACK_${index+1}`, sessionId);
            
        const fallbackResult = await sendSlackChannelMessage(organizationId, whisperData);
            
            if (fallbackResult.success) {
          console.log(`[LANGGRAPH] Successfully delivered whisper #${index+1} to fallback channel`);
              await logAgentStep('deliveryPhase', `FALLBACK_DELIVERED_${index+1}`, sessionId, {
                channel: fallbackResult.channel
              });
              
          if (whisper._id) {
            try {
              // Update the existing Whisper record with fallback delivery information
              await Whisper.findByIdAndUpdate(whisper._id, {
                status: 'delivered',
                delivered: true,
                deliveredAt: new Date(),
                channel: fallbackResult.channel || 'general',
                // Set mapped category and priority for compatibility
                priorityString: mapPriority(whisper.priority),
                // Set message directly for compatibility
                message: message,
                // Set suggested actions directly for compatibility
                suggestedActions: whisperData.suggestedActions,
                // Ensure organization is set (for queries that check both fields)
                organization: organizationId
              });
              
              console.log(`[LANGGRAPH] Updated whisper record with fallback delivery information`);
            } catch (updateError) {
              console.error('[LANGGRAPH] Error updating whisper:', updateError.message);
            }
          }
            }
          }
        } catch (error) {
          console.error(`[LANGGRAPH] Error delivering whisper #${index+1}:`, error);
          await logAgentStep('deliveryPhase', `DELIVERY_ERROR_${index+1}`, sessionId, {
            error: error.message,
            stack: error.stack
          });
          
      if (whisper._id) {
        try {
          // Update the existing Whisper record to mark delivery as failed
          await Whisper.findByIdAndUpdate(whisper._id, {
            status: 'failed',
            delivered: false,
            channel: 'delivery_failed',
            // Set mapped category and priority for compatibility
            priorityString: mapPriority(whisper.priority),
            // Set message directly for compatibility
            message: message,
            // Set suggested actions directly for compatibility
            suggestedActions: whisperData.suggestedActions,
            // Ensure organization is set (for queries that check both fields)
            organization: organizationId
          });
            
          console.log('[LANGGRAPH] Updated whisper record to mark delivery failure');
        } catch (updateError) {
          console.error('[LANGGRAPH] Error updating whisper:', updateError.message);
        }
        }
      }
    }
    
    await logAgentStep('deliveryPhase', 'DELIVERY_COMPLETE', sessionId, {
    totalDurationMs: Date.now() - state.startTime
  });
} 