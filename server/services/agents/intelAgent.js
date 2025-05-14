/**
 * Intel Agent
 * Analyzes development patterns from GitHub and other tools
 */

import { SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import AgentSession from '../../models/AgentSession.js';
import { createLLM, logAgentStep, createFallbackResult, tryParseJSON } from './utils.js';

/**
 * Create an Intel Agent instance
 * @param {String} modelName - Model name to use
 * @returns {Function} - Agent function
 */
export const createIntelAgent = (modelName = 'mistral') => {
  const llm = createLLM(modelName);
  
  const systemPrompt = `You are IntelAgent, an expert developer workflow analyst responsible for examining metadata from GitHub and development tools.

PRIMARY OBJECTIVE: Identify meaningful development patterns while maintaining complete privacy.

KEY PATTERN TYPES TO DETECT:
• Development Rhythms: Commit frequency variations by time/day/week
• PR Lifecycle: Time from branch creation to merge, review delays, feedback patterns
• Issue Dynamics: Time to resolution, discussion frequency, reopening patterns
• Collaboration Patterns: Cross-contributor work, isolated development, PR review distribution
• CI/CD Patterns: Build failures, deployment frequency, test coverage trends
• Quality Indicators: Bug-related work, hotfix frequency, documentation updates
• Integration Health: Merge conflicts, revert frequency, branch lifetimes

IMPORTANT CONSTRAINTS:
• You analyze ONLY metadata - timestamps, branch names, PR titles, issue metadata
• You NEVER see actual code content - privacy is paramount
• Focus on patterns rather than individual data points
• Preserve privacy by focusing on team-level trends, not individual behavior

RESPONSE FORMAT (JSON):
{{
  "patterns": [
    {{
      "type": "frequency|timing|collaboration|quality|cicd",
      "confidence": 0.85,
      "description": "Clear, specific pattern description with quantifiable metrics",
      "significance": "Why this pattern matters to team development workflow"
    }}
  ],
  "insights": [
    {{
      "type": "workflowEfficiency|codeQuality|teamCollaboration|deliveryPredictability",
      "description": "Concise insight derived from patterns",
      "impact": "Potential effects on team performance or development health",
      "dataPoints": ["Specific metrics or trends supporting this insight"]
    }}
  ]
}}

IMPORTANT: Your entire response must be valid JSON and nothing else. Do not include any explanatory text outside of the JSON structure. Always ensure insights are statistically significant and not based on sparse data.`;

  const humanPrompt = `Analyze the following development metadata:
{{metadata}}

Focus primarily on identifying patterns related to:
• Development workflow efficiency
• Code review and quality assurance processes
• Team collaboration in the development cycle
• Integration and delivery cadence
• Potential bottlenecks or friction points

Remember to preserve privacy by focusing ONLY on patterns and trends, not individual behaviors.`;

  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(humanPrompt)
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  // The actual agent function that will be called
  return async function intelAgent(state) {
    const { sessionId, organizationId, metadata } = state;
    
    await logAgentStep('intelAgent', 'START', sessionId, { 
      metadataCount: metadata.length,
      organizationId 
    });
    
    try {
      // Filter metadata relevant to this agent
      const developmentMetadata = metadata.filter(item => 
        item.metadata_type === 'commit_activity' || 
        item.metadata_type === 'pr_lifecycle' ||
        item.metadata_type === 'issue_tracking' ||
        item.metadata_type === 'code_review' ||
        (item.source && ['github', 'gitlab', 'jira'].includes(item.source.split('_')[0]))
      );
      
      // Check if we have enough data
      if (developmentMetadata.length < 10) {
        await logAgentStep('intelAgent', 'INSUFFICIENT_DATA', sessionId, {
          count: developmentMetadata.length
        });
        
        return { 
          ...state, 
          intelResults: createFallbackResult('intel'),
          intelAgentCompleted: true
        };
      }
      
      // Log the agent starting
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            logs: {
              level: 'info',
              message: 'IntelAgent processing started'
            }
          }
        }
      );
      
      await logAgentStep('intelAgent', 'INVOKING LLM', sessionId);
      
      // Process the metadata
      const startTime = Date.now();
      const result = await chain.invoke({
        metadata: JSON.stringify(developmentMetadata)
      });
      const duration = Date.now() - startTime;
      
      await logAgentStep('intelAgent', 'LLM RESPONSE RECEIVED', sessionId, { 
        durationMs: duration,
        rawResponsePreview: result.substring(0, 200) + (result.length > 200 ? '...' : '')
      });
      
      // Parse the result (should be JSON)
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
        
        await logAgentStep('intelAgent', 'PARSED JSON', sessionId, { 
          patternCount: parsedResult.patterns?.length || 0,
          insightCount: parsedResult.insights?.length || 0
        });
      } catch (error) {
        await logAgentStep('intelAgent', 'JSON PARSE ERROR', sessionId, { error: error.message });
        
        // Return a fallback result if parsing fails
        parsedResult = createFallbackResult('intel', error);
      }
      
      // Store results in agent session
      await AgentSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            'outputs.intelAgent': parsedResult,
            'metadata.intelAgentDuration': duration
          }
        }
      );
      
      await logAgentStep('intelAgent', 'COMPLETE', sessionId, {
        resultSize: JSON.stringify(parsedResult).length,
        durationMs: duration
      });
      
      return { 
        ...state, 
        intelResults: parsedResult,
        intelAgentCompleted: true
      };
    } catch (error) {
      await logAgentStep('intelAgent', 'ERROR', sessionId, {
        error: error.message,
        stack: error.stack
      });
      
      return { 
        ...state, 
        intelResults: createFallbackResult('intel', error),
        intelAgentCompleted: true,
        errors: [...(state.errors || []), {
          agent: 'intelAgent',
          message: error.message
        }]
      };
    }
  };
}; 