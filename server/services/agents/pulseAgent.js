/**
 * Pulse Agent
 * Analyzes communication patterns from Slack and email
 */

import { SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import AgentSession from '../../models/AgentSession.js';
import { createLLM, logAgentStep, createFallbackResult, tryParseJSON } from './utils.js';

/**
 * Create a Pulse Agent instance
 * @param {String} modelName - Model name to use
 * @returns {Function} - Agent function
 */
export const createPulseAgent = (modelName = 'mistral') => {
  const llm = createLLM(modelName);
  
  const systemPrompt = `You are PulseAgent, an expert communication analyst responsible for examining metadata from Slack and email communications.

PRIMARY OBJECTIVE: Identify meaningful communication patterns while respecting complete privacy.

KEY PATTERN TYPES TO DETECT:
• Communication Rhythms: Message frequency variations by time/day/week
• Response Dynamics: Time gaps between messages, response rates, delayed responses (2+ hours)
• Engagement Patterns: Thread depth, message length trends, activity/inactivity periods
• Interaction Networks: Who communicates with whom, siloed vs. distributed
• Reaction Behaviors: Emoji patterns, reaction frequency and types, declining emoji usage
• Time-of-Day Patterns: Work hour vs. non-work hour activity, late night communication
• Weekend Activity: Work-life balance indicators

IMPORTANT CONSTRAINTS:
• You analyze ONLY metadata - timestamps, participant IDs, message counts, reactions
• You NEVER see actual message content - privacy is paramount
• Focus on patterns rather than individual data points
• Preserve privacy by focusing on team-level trends, not individual behavior

RESPONSE FORMAT (JSON):
{{
  "patterns": [
    {{
      "type": "frequency|timing|participation|emoji|interaction",
      "confidence": 0.85,
      "description": "Clear, specific pattern description with quantifiable metrics",
      "significance": "Why this pattern matters to team dynamics"
    }}
  ],
  "insights": [
    {{
      "type": "teamDynamics|workloadDistribution|communicationFlow|workLifeBalance",
      "description": "Concise insight derived from patterns",
      "impact": "Potential effects on team performance or well-being",
      "dataPoints": ["Specific metrics or trends supporting this insight"]
    }}
  ]
}}

IMPORTANT: Your entire response must be valid JSON and nothing else. Do not include any explanatory text outside of the JSON structure. Always ensure insights are statistically significant and not based on sparse data.`;

  const humanPrompt = `Analyze the following communication metadata:
{{metadata}}

Focus primarily on identifying patterns related to:
• Message timing and frequency across different timeframes
• Response patterns and engagement levels
• Usage of reactions and emoji
• Team interaction dynamics
• Work hours vs. after-hours communication

Remember to preserve privacy by focusing ONLY on patterns and trends, not individual behaviors.`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(humanPrompt)
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  // The actual agent function that will be called
  return async function pulseAgent(state) {
    const { sessionId, organizationId, metadata } = state;
    
    await logAgentStep('pulseAgent', 'START', sessionId, { 
      metadataCount: metadata.length,
      organizationId
    });
    
    try {
      // Filter metadata relevant to this agent
      const communicationMetadata = metadata.filter(item => 
        item.metadata_type === 'communication_metadata' || 
        (item.source && ['slack', 'email'].includes(item.source.split('_')[0])));
      
      // Check if we have enough data
      if (communicationMetadata.length < 10) {
        await logAgentStep('pulseAgent', 'INSUFFICIENT_DATA', sessionId, {
          count: communicationMetadata.length
        });
        return { 
          ...state, 
          pulseResults: createFallbackResult('pulse'),
          pulseAgentCompleted: true
        };
      }
      
      // Log the agent starting in the database
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            logs: {
              level: 'info',
              message: 'PulseAgent processing started'
            }
          }
        }
      );
      
      await logAgentStep('pulseAgent', 'INVOKING LLM', sessionId);
      
      // Process the metadata
      const startTime = Date.now();
      const result = await chain.invoke({
        metadata: JSON.stringify(communicationMetadata)
      });
      const duration = Date.now() - startTime;
      
      await logAgentStep('pulseAgent', 'LLM RESPONSE RECEIVED', sessionId, { 
        durationMs: duration,
        rawResponsePreview: result.substring(0, 200) + (result.length > 200 ? '...' : '')
      });
      
      // Parse the result (should be JSON)
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
        
        await logAgentStep('pulseAgent', 'PARSED JSON', sessionId, { 
          patternCount: parsedResult.patterns?.length || 0,
          insightCount: parsedResult.insights?.length || 0
        });
      } catch (error) {
        await logAgentStep('pulseAgent', 'JSON PARSE ERROR', sessionId, { error: error.message });
        
        // Return a fallback result if parsing fails
        parsedResult = createFallbackResult('pulse', error);
      }
      
      // Store results in agent session
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            'outputs.pulseAgent': parsedResult,
            'metadata.pulseAgentDuration': duration
          }
        }
      );
      
      await logAgentStep('pulseAgent', 'COMPLETE', sessionId, {
        resultSize: JSON.stringify(parsedResult).length,
        durationMs: duration
      });
      
      return { 
        ...state, 
        pulseResults: parsedResult,
        pulseAgentCompleted: true
      };
    } catch (error) {
      await logAgentStep('pulseAgent', 'ERROR', sessionId, {
        error: error.message,
        stack: error.stack
      });
      
      return { 
        ...state, 
        pulseResults: createFallbackResult('pulse', error),
        pulseAgentCompleted: true,
        errors: [...(state.errors || []), {
          agent: 'pulseAgent',
          message: error.message
        }]
      };
    }
  };
}; 