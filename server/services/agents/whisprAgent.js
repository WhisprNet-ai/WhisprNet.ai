/**
 * Whispr Agent
 * Generates actionable insights and recommendations
 */

import { SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import AgentSession from '../../models/AgentSession.js';
import Whisper from '../../models/Whisper.js';
import { v4 as uuidv4 } from 'uuid';
import { createLLM, logAgentStep, createFallbackResult, tryParseJSON } from './utils.js';

/**
 * Create a Whispr Agent instance
 * @param {String} modelName - Model name to use
 * @returns {Function} - Agent function
 */
export const createWhisprAgent = (modelName = 'mistral') => {
  const llm = createLLM(modelName);
  
  const systemPrompt = `You are WhisprAgent, an expert communication strategist who transforms insights into actionable recommendations.

PRIMARY OBJECTIVE: Create useful, actionable "whispers" that help teams improve their workflow and communication.

WHISPER GUIDELINES:
• Whispers should be concise, clear, and immediately actionable
• Focus on positive improvements rather than negatives or complaints
• Each whisper requires a specific, practical action that can be implemented
• Prioritize high-impact, easy-to-implement suggestions first
• Present information in a way that inspires action
• Always maintain team privacy by addressing patterns, not individuals

WHISPER TYPES:
• Team Improvement: Ways to enhance communication or workflow
• Workflow Optimization: Opportunities to reduce friction in development processes
• Health Alert: When data suggests potential team burnout or stress
• Collaboration Opportunity: Ways to improve cross-functional teamwork
• Recognition: Acknowledge positive patterns worth reinforcing

RESPONSE FORMAT (JSON):
{{
  "whispers": [
    {{
      "title": "Brief, catchy title for the whisper",
      "category": "improvement|optimization|health|collaboration|recognition",
      "priority": 1-5 (1=highest),
      "content": {{
        "message": "Clear, specific message about the identified pattern",
        "suggestedActions": [
          "Specific, practical action that can be taken immediately", 
          "Another recommended action if applicable"
        ],
        "rationale": "Brief explanation of why these actions will help"
      }}
    }}
  ]
}}

IMPORTANT: Your entire response must be valid JSON and nothing else. Do not include any explanatory text outside of the JSON structure. Focus on creating 2-3 high-quality whispers rather than many lower-quality ones.`;

  const humanPrompt = `Based on the following insights and anomalies, create actionable whispers:

Pulse Agent Insights (communication):
{{pulseResults}}

Intel Agent Insights (development):
{{intelResults}}

Sentinel Agent Anomalies:
{{sentinelResults}}

WHISPER CREATION GUIDELINES:
• Focus on the most significant insights with clear action paths
• Balance positive reinforcement with improvement opportunities
• Ensure privacy by addressing patterns, never individuals
• Make actions specific enough to implement, but not prescriptively detailed
• Consider the appropriate audience for each whisper (team vs. leadership)

Optimize for motivation and clarity. Each whisper should inspire action rather than create concern.`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(humanPrompt)
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  // The actual agent function that will be called
  return async function whisprAgent(state) {
    const { sessionId, organizationId, pulseResults, intelResults, sentinelResults } = state;
    
    await logAgentStep('whisprAgent', 'START', sessionId, { 
      hasAnomalies: (sentinelResults?.anomalies?.length || 0) > 0,
      anomalyCount: sentinelResults?.anomalies?.length || 0
    });
    
    try {
      // Log the agent starting
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            logs: {
              level: 'info',
              message: 'WhisprAgent processing started'
            }
          }
        }
      );
      
      await logAgentStep('whisprAgent', 'INVOKING LLM', sessionId, {
        inputSummary: {
          pulseInsights: pulseResults?.insights?.length || 0,
          intelInsights: intelResults?.insights?.length || 0,
          sentinelAnomalies: sentinelResults?.anomalies?.length || 0
        }
      });
      
      // Generate whispers based on previous results
      const startTime = Date.now();
      const result = await chain.invoke({
        pulseResults: JSON.stringify(pulseResults),
        intelResults: JSON.stringify(intelResults),
        sentinelResults: JSON.stringify(sentinelResults)
      });
      const duration = Date.now() - startTime;
      
      await logAgentStep('whisprAgent', 'LLM RESPONSE RECEIVED', sessionId, { 
        durationMs: duration,
        rawResponsePreview: result.substring(0, 200) + (result.length > 200 ? '...' : '')
      });
      
      // Parse the result (should be JSON)
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
        
        await logAgentStep('whisprAgent', 'PARSED JSON', sessionId, { 
          whisperCount: parsedResult.whispers?.length || 0
        });
      } catch (error) {
        await logAgentStep('whisprAgent', 'JSON PARSE ERROR', sessionId, { error: error.message });
        
        // Return a fallback result if parsing fails
        parsedResult = createFallbackResult('whispr', error);
      }
      
      // Create Whisper records for each whisper
      const whispers = [];
      
      if (parsedResult.whispers && parsedResult.whispers.length > 0) {
        for (const [index, whisperData] of parsedResult.whispers.entries()) {
          try {
            await logAgentStep('whisprAgent', `CREATING WHISPER #${index+1}`, sessionId, {
              title: whisperData.title,
              category: whisperData.category
            });
            
            // Create a new Whisper record
            const whisper = new Whisper({
              whisperId: `whspr_${uuidv4()}`,
              source: 'agent',
              organizationId,
              title: whisperData.title,
              category: whisperData.category || 'improvement',
              priority: whisperData.priority || 3,
              content: whisperData.content || {
                message: whisperData.message || '',
                suggestedActions: whisperData.suggestedActions || []
              },
              metadata: {
                agentSessionId: sessionId,
                generatedBy: 'whisprAgent',
                generatedAt: new Date(),
                modelName: modelName
              },
              status: 'pending' // Will be set to 'delivered' after sending
            });
            
            await whisper.save();
            whispers.push(whisper);
          } catch (error) {
            console.error(`Error creating whisper record: ${error.message}`);
          }
        }
        
        await logAgentStep('whisprAgent', 'WHISPERS SAVED', sessionId, {
          createdCount: whispers.length,
          totalWhispers: parsedResult.whispers.length
        });
      }
      
      // Store results in agent session
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            'outputs.whisprAgent': parsedResult,
            'metadata.whisprAgentDuration': duration,
            'metadata.whisperIds': whispers.map(w => w._id)
          }
        }
      );
      
      await logAgentStep('whisprAgent', 'COMPLETE', sessionId, {
        resultSize: JSON.stringify(parsedResult).length,
        durationMs: duration,
        whisperCount: whispers.length
      });
      
      return { 
        ...state, 
        whispers: whispers.length > 0 ? whispers : parsedResult.whispers || [],
        whisprAgentCompleted: true,
        completed: true
      };
    } catch (error) {
      await logAgentStep('whisprAgent', 'ERROR', sessionId, {
        error: error.message,
        stack: error.stack
      });
      
      return { 
        ...state, 
        whispers: [],
        whisprAgentCompleted: true,
        completed: true,
        errors: [...(state.errors || []), {
          agent: 'whisprAgent',
          message: error.message
        }]
      };
    }
  };
}; 