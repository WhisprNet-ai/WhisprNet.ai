import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Default Ollama config
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || 'mistral';

/**
 * Generate completions using Ollama API
 * @param {String} prompt - The prompt to send to Ollama
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Response from Ollama API
 */
export const generateCompletion = async (prompt, options = {}) => {
  try {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      topP = 0.9,
      maxTokens = 1024,
      stream = false
    } = options;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model,
      prompt,
      stream,
      options: {
        temperature,
        top_p: topP,
        num_predict: maxTokens
      }
    });

    return {
      success: true,
      data: response.data,
      model,
      temperature
    };
  } catch (error) {
    console.error('Error calling Ollama API:', error.message);
    return {
      success: false,
      error: error.message,
      model: options.model || DEFAULT_MODEL
    };
  }
};

/**
 * Generate insight from Slack metadata using Ollama
 * @param {Array} metadata - Array of Slack metadata objects 
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Generated insight
 */
export const generateSlackInsight = async (metadata, options = {}) => {
  try {
    // Construct a prompt to analyze Slack metadata
    const prompt = `You are a specialized team dynamics analyst examining Slack activity metadata to identify patterns that impact team health and productivity.

ANALYSIS OBJECTIVE:
Identify meaningful patterns in team communication that suggest potential improvements or concerns.

INPUT CONTEXT:
${JSON.stringify(metadata, null, 2)}

ANALYSIS FOCUS AREAS:
• Communication Rhythms: Message frequency and timing patterns
• Response Dynamics: Time to response, thread participation depth
• Team Interaction: Balance of communication across team members
• Engagement Indicators: Reaction usage, conversation continuity
• Workload Signals: Message volume distribution, after-hours communication

IMPORTANT CONSTRAINTS:
• You are analyzing ONLY metadata - never message content
• Privacy is paramount - focus on patterns, not individuals
• Base your insights on statistically significant observations

RESPONSE FORMAT:
Provide exactly 1-3 sentences that:
1. Identify the most significant pattern
2. Explain its potential impact on team dynamics
3. Offer one specific, actionable recommendation

Note: Be precise, evidence-based, and constructive. Frame your response as an opportunity for improvement rather than criticism.`;

    const result = await generateCompletion(prompt, options);
    
    if (!result.success) {
      throw new Error(`Ollama API error: ${result.error}`);
    }
    
    return {
      success: true,
      insight: result.data.response,
      model: result.model,
      temperature: result.temperature
    };
  } catch (error) {
    console.error('Error generating Slack insight:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Format metadata insights into actionable whispers
 * @param {String} rawInsight - Raw insight text from LLM
 * @param {Array} metadata - The original metadata that produced the insight
 * @returns {Object} - Formatted whisper object
 */
export const formatInsightToWhisper = (rawInsight, metadata) => {
  // Basic implementation - in production, you'd use LLM to structure this better
  const defaultCategory = determineCategory(rawInsight);
  const defaultPriority = determinePriority(rawInsight);
  
  const whisper = {
    title: generateTitle(rawInsight, defaultCategory),
    message: rawInsight,
    category: defaultCategory,
    priority: defaultPriority,
    suggestedActions: generateSuggestedActions(rawInsight, defaultCategory),
    targetType: 'team',
    confidence: 0.8
  };
  
  return whisper;
};

/**
 * Helper function to determine insight category
 */
const determineCategory = (insight) => {
  const lowerInsight = insight.toLowerCase();
  
  if (lowerInsight.includes('burnout') || 
      lowerInsight.includes('stress') ||
      lowerInsight.includes('overwork')) {
    return 'warning';
  }
  
  if (lowerInsight.includes('recommend') || 
      lowerInsight.includes('suggest') ||
      lowerInsight.includes('consider')) {
    return 'suggestion';
  }
  
  if (lowerInsight.includes('critical') || 
      lowerInsight.includes('urgent') ||
      lowerInsight.includes('immediate')) {
    return 'alert';
  }
  
  return 'insight';
};

/**
 * Helper function to determine priority
 */
const determinePriority = (insight) => {
  const lowerInsight = insight.toLowerCase();
  
  if (lowerInsight.includes('critical') || 
      lowerInsight.includes('urgent') ||
      lowerInsight.includes('severe')) {
    return 'critical';
  }
  
  if (lowerInsight.includes('important') || 
      lowerInsight.includes('significant') ||
      lowerInsight.includes('concerning')) {
    return 'high';
  }
  
  if (lowerInsight.includes('moderate') || 
      lowerInsight.includes('consider') ||
      lowerInsight.includes('potential')) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Helper function to generate insight title
 */
const generateTitle = (insight, category) => {
  const categoryTitles = {
    'warning': 'Potential Team Concern Detected',
    'suggestion': 'Communication Pattern Suggestion',
    'alert': 'Urgent Team Dynamic Alert',
    'insight': 'Team Communication Insight'
  };
  
  return categoryTitles[category] || 'WhisprNet Communication Insight';
};

/**
 * Helper function to generate suggested actions
 */
const generateSuggestedActions = (insight, category) => {
  const lowerInsight = insight.toLowerCase();
  const actions = [];
  
  // Default actions based on category
  switch (category) {
    case 'warning':
      actions.push('Schedule a team check-in to discuss workload');
      actions.push('Review project timelines and priorities');
      break;
    case 'suggestion':
      actions.push('Consider adjusting communication channels');
      actions.push('Update team communication guidelines');
      break;
    case 'alert':
      actions.push('Schedule an immediate team meeting');
      actions.push('Address the issue with individual team members');
      actions.push('Adjust project timelines or resources');
      break;
    case 'insight':
      actions.push('Share this insight with team leads');
      actions.push('Monitor this pattern in coming weeks');
      break;
  }
  
  // Add specific actions based on content
  if (lowerInsight.includes('burnout')) {
    actions.push('Consider implementing mandatory breaks or time off');
  }
  
  if (lowerInsight.includes('disengagement')) {
    actions.push('Schedule one-on-one check-ins with team members');
  }
  
  if (lowerInsight.includes('response time') || lowerInsight.includes('delay')) {
    actions.push('Review team communication SLAs');
  }
  
  return actions;
}; 