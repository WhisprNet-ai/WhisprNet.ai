/**
 * Sentinel Agent
 * Detects anomalies by combining insights from other agents
 */

import { SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import AgentSession from '../../models/AgentSession.js';
import { createLLM, logAgentStep, createFallbackResult, tryParseJSON } from './utils.js';

/**
 * Create a Sentinel Agent instance
 * @param {String} modelName - Model name to use
 * @returns {Function} - Agent function
 */
export const createSentinelAgent = (modelName = 'mistral') => {
  const llm = createLLM(modelName);
  
  const systemPrompt = `You are SentinelAgent, a specialized analyst who correlates cross-functional team patterns to identify potential issues.

PRIMARY OBJECTIVE: Identify meaningful anomalies by connecting communication and development patterns.

KEY ANOMALY CATEGORIES:
• Communication-Development Disconnect: Misalignment between communication and development activities
• Workflow Bottlenecks: Patterns suggesting stalled processes or decision delays
• Team Strain Indicators: Signs of potential burnout or reduced engagement
• Siloing Risks: Evidence of information or collaboration gaps between team members
• Quality Risk Indicators: Patterns suggesting potential quality issues in future
• Process Friction: Where established processes appear to be causing delays/issues

IMPORTANT CONSTRAINTS:
• You analyze ONLY patterns identified by other agents, not raw metadata
• Preserve privacy by focusing only on team-level trends, not individuals
• Identify anomalies only when supported by multiple converging indicators

RESPONSE FORMAT (JSON):
{{
  "anomalies": [
    {{
      "type": "workflow|communication|team_health|quality|process",
      "severity": 0.75,
      "description": "Clear, specific anomaly description with quantifiable metrics",
      "significance": "Why this anomaly matters to team performance",
      "indicators": ["Specific patterns/signals supporting this anomaly"],
      "confidence": 0.85
    }}
  ]
}}

IMPORTANT: Your entire response must be valid JSON and nothing else. Do not include any explanatory text outside of the JSON structure. Be conservative - only flag clear anomalies with substantial evidence.`;

  const humanPrompt = `Review these patterns from the PulseAgent (communication):
{{pulseResults}}

And these patterns from the IntelAgent (development):
{{intelResults}}

CORRELATION GUIDELINES:
• Look for complementary signals across both domains
• Identify how communication patterns might explain development workflow issues
• Detect if development pressures are affecting team communication health
• Consider team context and industry norms when evaluating anomalies

Identify anomalies only when supported by multiple converging indicators.`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(humanPrompt)
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  // The actual agent function that will be called
  return async function sentinelAgent(state) {
    const { sessionId, organizationId, pulseResults, intelResults } = state;
    
    await logAgentStep('sentinelAgent', 'START', sessionId, { 
      pulsePatterns: pulseResults?.patterns?.length || 0,
      intelPatterns: intelResults?.patterns?.length || 0 
    });
    
    try {
      // Log the agent starting
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            logs: {
              level: 'info',
              message: 'SentinelAgent processing started'
            }
          }
        }
      );
      
      await logAgentStep('sentinelAgent', 'INVOKING LLM', sessionId, {
        pulseResultsSample: pulseResults?.patterns?.slice(0, 2) || [],
        intelResultsSample: intelResults?.patterns?.slice(0, 2) || []
      });
      
      // Process results from previous agents
      const startTime = Date.now();
      const result = await chain.invoke({
        pulseResults: JSON.stringify(pulseResults),
        intelResults: JSON.stringify(intelResults)
      });
      const duration = Date.now() - startTime;
      
      await logAgentStep('sentinelAgent', 'LLM RESPONSE RECEIVED', sessionId, { 
        durationMs: duration,
        rawResponsePreview: result.substring(0, 200) + (result.length > 200 ? '...' : '')
      });
      
      // Parse the result (should be JSON)
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
        
        await logAgentStep('sentinelAgent', 'PARSED JSON', sessionId, { 
          anomalyCount: parsedResult.anomalies?.length || 0
        });
      } catch (error) {
        await logAgentStep('sentinelAgent', 'JSON PARSE ERROR', sessionId, { error: error.message });
        
        // Return a fallback result if parsing fails
        parsedResult = createFallbackResult('sentinel', error);
      }
      
      // Store results in agent session
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            'outputs.sentinelAgent': parsedResult,
            'metadata.sentinelAgentDuration': duration
          }
        }
      );
      
      await logAgentStep('sentinelAgent', 'COMPLETE', sessionId, {
        resultSize: JSON.stringify(parsedResult).length,
        durationMs: duration,
        anomalyCount: parsedResult.anomalies?.length || 0
      });
      
      return { 
        ...state, 
        sentinelResults: parsedResult,
        sentinelAgentCompleted: true
      };
    } catch (error) {
      await logAgentStep('sentinelAgent', 'ERROR', sessionId, {
        error: error.message,
        stack: error.stack
      });
      
      return { 
        ...state, 
        sentinelResults: createFallbackResult('sentinel', error),
        sentinelAgentCompleted: true,
        errors: [...(state.errors || []), {
          agent: 'sentinelAgent',
          message: error.message
        }]
      };
    }
  };
}; 