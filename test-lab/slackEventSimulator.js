/**
 * Slack Event Simulator for WhisprNet.ai
 * 
 * This script simulates Slack workspace activity to test WhisprNet's event ingestion
 * and metadata analysis pipeline. It generates realistic team interactions that
 * trigger WhisprNet's whisper agents.
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';

// Configuration
const CONFIG = {
  runTimeMinutes: 10,
  eventIntervalMin: 1000, // ms (1 second)
  eventIntervalMax: 3000, // ms (3 seconds)
  targetUrl: 'http://localhost:3000/api/slack/events/{{organizationId}}',
  organizationId: '6817a449e2ab38a59a0e4b8a', // Replace with your actual organization ID
  debug: true, // Enable debug mode for more verbose logging
};

// Synthetic Personas
const PERSONAS = {
  SENIOR_ENGINEER: {
    id: 'U1001',
    name: 'Sarah Chen',
    title: 'Senior Engineer',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    timezone: 'America/Los_Angeles',
    style: 'direct, technical, thorough'
  },
  JUNIOR_ENGINEER: {
    id: 'U1002',
    name: 'Alex Johnson',
    title: 'Junior Engineer',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    timezone: 'America/New_York',
    style: 'curious, eager to learn, asks questions'
  },
  PROJECT_MANAGER: {
    id: 'U1003',
    name: 'Maya Patel',
    title: 'Project Manager',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
    timezone: 'America/Chicago',
    style: 'organized, deadline-focused, clear communication'
  },
  DEVOPS_BOT: {
    id: 'U1004',
    name: 'BuildBot',
    title: 'DevOps Bot',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=BuildBot',
    timezone: 'UTC',
    style: 'automated, consistent, factual'
  }
};

// Channels
const CHANNELS = {
  GENERAL: { id: 'C1001', name: 'general' },
  ENGINEERING: { id: 'C1002', name: 'engineering' },
  RANDOM: { id: 'C1003', name: 'random' },
  PROJ_ALPHA: { id: 'C1004', name: 'proj-alpha' }
};

// Common emojis
const EMOJIS = [
  'thumbsup', 'thumbsdown', 'heart', 'joy', 'thinking_face', 
  'raised_hands', 'clap', 'fire', 'rocket', 'eyes'
];

// Event types
const EVENT_TYPES = [
  'message.posted',
  'reaction_added',
  'emoji_used',
  'message.edited',
  'channel_joined'
];

// Message timestamps cache to reference for reactions and edits
const messageTimestamps = new Map();

/**
 * Utility function to get a random item from an array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Utility function to get a random number between min and max
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random timestamp for the current day
 * With optional hourOffset to simulate specific times of day
 */
function generateTimestamp(hourOffset = 0) {
  const now = new Date();
  
  // Set the hour based on offset (useful for simulating time patterns)
  if (hourOffset) {
    now.setHours(hourOffset);
    now.setMinutes(getRandomNumber(0, 59));
    now.setSeconds(getRandomNumber(0, 59));
  }
  
  return now.getTime() / 1000; // Slack uses Unix timestamp in seconds
}

/**
 * Create event payload for message.posted
 */
function createMessagePostedEvent(scenario = null) {
  const user = scenario?.user || getRandomItem(Object.values(PERSONAS));
  const channel = scenario?.channel || getRandomItem(Object.values(CHANNELS));
  const ts = `${generateTimestamp(scenario?.hour)}`;
  const hasThread = Math.random() > 0.7;
  const threadTs = hasThread ? messageTimestamps.get(channel.id) || ts : null;
  const messageLength = getRandomNumber(5, 200);
  
  // Store this message timestamp for future reference
  messageTimestamps.set(channel.id, ts);
  
  return {
    type: "message",
    event_ts: ts,
    user: user.id,
    user_name: user.name, // Custom field for simulator
    text: `Mock message with length ${messageLength}`,
    channel: channel.id,
    channel_name: channel.name, // Custom field for simulator
    channel_type: "channel",
    team: "T12345",
    blocks: [],
    attachments: Math.random() > 0.8 ? [{ text: "Mock attachment" }] : [],
    ts: ts,
    thread_ts: threadTs,
    is_thread_broadcast: false
  };
}

/**
 * Create event payload for reaction_added
 */
function createReactionAddedEvent(scenario = null) {
  const user = scenario?.user || getRandomItem(Object.values(PERSONAS));
  const channel = scenario?.channel || getRandomItem(Object.values(CHANNELS));
  const ts = messageTimestamps.get(channel.id) || `${generateTimestamp(scenario?.hour)}`;
  const emoji = scenario?.emoji || getRandomItem(EMOJIS);
  
  return {
    type: "reaction_added",
    user: user.id,
    user_name: user.name, // Custom field for simulator
    reaction: emoji,
    item_user: getRandomItem(Object.values(PERSONAS)).id,
    item: {
      type: "message",
      channel: channel.id,
      ts: ts
    },
    event_ts: `${generateTimestamp(scenario?.hour)}`
  };
}

/**
 * Create event payload for emoji_used
 */
function createEmojiUsedEvent(scenario = null) {
  const user = scenario?.user || getRandomItem(Object.values(PERSONAS));
  const channel = scenario?.channel || getRandomItem(Object.values(CHANNELS));
  const emoji = scenario?.emoji || getRandomItem(EMOJIS);
  
  return {
    event_id: `evt-${Date.now()}`,
    type: 'emoji_used',
    timestamp: generateTimestamp(scenario?.hour),
    metadata: {
      team: 'T12345',
      channel: channel.id,
      channel_name: channel.name,
      user: user.id,
      user_name: user.name,
      emoji: emoji,
      context: 'message'
    }
  };
}

/**
 * Create event payload for message.edited
 */
function createMessageEditedEvent(scenario = null) {
  const user = scenario?.user || getRandomItem(Object.values(PERSONAS));
  const channel = scenario?.channel || getRandomItem(Object.values(CHANNELS));
  const original_ts = messageTimestamps.get(channel.id) || `${generateTimestamp(scenario?.hour)}`;
  const edit_ts = `${generateTimestamp(scenario?.hour)}`;
  
  return {
    type: "message",
    subtype: "message_changed",
    hidden: true,
    message: {
      type: "message",
      user: user.id,
      text: "This message was edited",
      edited: {
        user: user.id,
        ts: edit_ts
      },
      ts: original_ts
    },
    channel: channel.id,
    channel_name: channel.name, // Custom field for simulator
    event_ts: edit_ts,
    ts: edit_ts
  };
}

/**
 * Create event payload for channel_joined
 */
function createChannelJoinedEvent(scenario = null) {
  const user = scenario?.user || getRandomItem(Object.values(PERSONAS));
  const channel = scenario?.channel || getRandomItem(Object.values(CHANNELS));
  
  return {
    event_id: `evt-${Date.now()}`,
    type: 'channel_joined',
    timestamp: generateTimestamp(scenario?.hour),
    metadata: {
      team: 'T12345',
      channel: channel.id,
      channel_name: channel.name,
      user: user.id,
      user_name: user.name,
      inviter: getRandomItem(Object.values(PERSONAS)).id
    }
  };
}

/**
 * Create an event based on type
 */
function createEvent(type, scenario = null) {
  switch(type) {
    case 'message.posted':
      return createMessagePostedEvent(scenario);
    case 'reaction_added':
      return createReactionAddedEvent(scenario);
    case 'emoji_used':
      return createEmojiUsedEvent(scenario);
    case 'message.edited':
      return createMessageEditedEvent(scenario);
    case 'channel_joined':
      return createChannelJoinedEvent(scenario);
    default:
      return createMessagePostedEvent(scenario);
  }
}

/**
 * Send an event to the WhisprNet.ai server
 */
async function sendEvent(event) {
  try {
    const url = CONFIG.targetUrl.replace('{{organizationId}}', CONFIG.organizationId);
    
    // Create a proper Slack Events API payload wrapper
    const slackEventPayload = {
      type: "event_callback",
      token: "xoxb-mock-verification-token",
      team_id: "T12345",
      api_app_id: "A12345MOCK",
      event: event,
      event_context: `EC${Date.now()}`,
      event_id: `Ev${Date.now()}`,
      event_time: Math.floor(Date.now() / 1000),
      challenge: `challenge_${Date.now()}`, // Add challenge field for URL verification
      authorizations: [
        {
          enterprise_id: null,
          team_id: "T12345",
          user_id: event.user || "U1000",
          is_bot: event.user === PERSONAS.DEVOPS_BOT.id,
          is_enterprise_install: false
        }
      ],
      is_ext_shared_channel: false,
      context_team_id: "T12345",
      context_enterprise_id: null
    };
    
    if (CONFIG.debug) {
      console.log('📤 Sending event payload:', JSON.stringify(slackEventPayload, null, 2));
    } else {
      console.log(`📤 Sending ${event.type} from ${event.user_name || event.user} in #${event.channel_name || event.channel}`);
    }
    
    const response = await axios.post(url, slackEventPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Slack-Request-Timestamp': Math.floor(Date.now() / 1000),
        'X-Slack-Signature': 'v0=mockSignature123456',  // Mock signature
        'X-WhisprNet-Test': 'true'  // Special header to bypass signature verification in test mode
      }
    });
    
    console.log(`✅ Event sent successfully: ${response.status}`);
    if (CONFIG.debug && response.data) {
      console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
    }
    return true;
  } catch (error) {
    console.error(`❌ Error sending event: ${error.message}`);
    if (error.response) {
      console.error(`Server responded with ${error.response.status}`);
      if (CONFIG.debug) {
        if (typeof error.response.data === 'string') {
          console.error(`Response body: ${error.response.data.substring(0, 500)}...`);
        } else {
          console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.error(`Response headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      }
    }
    return false;
  }
}

/**
 * Send a URL verification request to help initialize the endpoint
 */
async function sendUrlVerification() {
  try {
    const url = CONFIG.targetUrl.replace('{{organizationId}}', CONFIG.organizationId);
    
    console.log('📡 Sending URL verification request...');
    
    const challenge = `challenge_${Date.now()}`;
    const verificationPayload = {
      type: "url_verification",
      token: "xoxb-mock-verification-token",
      challenge: challenge
    };
    
    const response = await axios.post(url, verificationPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-WhisprNet-Test': 'true'  // Special header to bypass signature verification in test mode
      }
    });
    
    console.log(`✅ URL verification response: ${response.status}`);
    console.log(`🔄 Challenge response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.error(`❌ URL verification failed: ${error.message}`);
    if (error.response) {
      console.error(`Server responded with ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Simulate a realistic scenario
 */
async function simulateScenario() {
  console.log('🎬 Starting scenario simulation');
  
  // Morning standup - PM sends messages at 10AM
  console.log('📅 Morning standup - PM activity');
  await sendEvent(createEvent('message.posted', {
    user: PERSONAS.PROJECT_MANAGER,
    channel: CHANNELS.ENGINEERING,
    hour: 10
  }));
  
  await setTimeout(getRandomNumber(CONFIG.eventIntervalMin, CONFIG.eventIntervalMax));
  
  // Senior responds around 10:30AM
  console.log('📅 Senior engineer responds');
  await sendEvent(createEvent('message.posted', {
    user: PERSONAS.SENIOR_ENGINEER,
    channel: CHANNELS.ENGINEERING,
    hour: 10
  }));
  
  await setTimeout(getRandomNumber(CONFIG.eventIntervalMin, CONFIG.eventIntervalMax));
  
  // Junior asks a question
  console.log('📅 Junior engineer asks a question');
  await sendEvent(createEvent('message.posted', {
    user: PERSONAS.JUNIOR_ENGINEER,
    channel: CHANNELS.ENGINEERING,
    hour: 11
  }));
  
  await setTimeout(getRandomNumber(CONFIG.eventIntervalMin * 5, CONFIG.eventIntervalMax * 5));
  
  // Delayed response from senior
  console.log('📅 Delayed response from senior');
  await sendEvent(createEvent('message.posted', {
    user: PERSONAS.SENIOR_ENGINEER,
    channel: CHANNELS.ENGINEERING,
    hour: 14
  }));
  
  await setTimeout(getRandomNumber(CONFIG.eventIntervalMin, CONFIG.eventIntervalMax));
  
  // Bot posts a build status
  console.log('📅 Bot posts build status');
  await sendEvent(createEvent('message.posted', {
    user: PERSONAS.DEVOPS_BOT,
    channel: CHANNELS.ENGINEERING,
    hour: 15
  }));
  
  await setTimeout(getRandomNumber(CONFIG.eventIntervalMin, CONFIG.eventIntervalMax));
  
  // Reaction from PM
  console.log('📅 PM reacts to build status');
  await sendEvent(createEvent('reaction_added', {
    user: PERSONAS.PROJECT_MANAGER,
    channel: CHANNELS.ENGINEERING,
    emoji: 'thumbsup',
    hour: 15
  }));
  
  await setTimeout(getRandomNumber(CONFIG.eventIntervalMin, CONFIG.eventIntervalMax));
  
  // Evening activity from senior (burnout pattern)
  console.log('📅 Evening activity from senior (potential burnout pattern)');
  await sendEvent(createEvent('message.posted', {
    user: PERSONAS.SENIOR_ENGINEER,
    channel: CHANNELS.ENGINEERING,
    hour: 22
  }));
  
  console.log('🎬 Scenario simulation completed');
}

/**
 * Main function to run the simulator
 */
async function runSimulator() {
  console.log('🚀 Starting WhisprNet.ai Slack Event Simulator');
  console.log(`⏱️  Running for ${CONFIG.runTimeMinutes} minutes`);
  console.log(`🎯 Target URL: ${CONFIG.targetUrl.replace('{{organizationId}}', CONFIG.organizationId)}`);
  console.log('👥 Using synthetic personas:', Object.keys(PERSONAS).join(', '));
  console.log('-------------------------------------------');
  
  // First try to verify the URL is working
  await sendUrlVerification();
  
  const startTime = Date.now();
  const endTime = startTime + (CONFIG.runTimeMinutes * 60 * 1000);
  let eventCount = 0;
  
  // Run the realistic scenario first
  await simulateScenario();
  eventCount += 8; // Count of events in the scenario
  
  // Then continue with random events until time is up
  while (Date.now() < endTime) {
    // Select a random event type
    const eventType = getRandomItem(EVENT_TYPES);
    
    // Create and send the event
    const event = createEvent(eventType);
    const success = await sendEvent(event);
    
    if (success) {
      eventCount++;
    }
    
    // Random delay between events
    const delay = getRandomNumber(CONFIG.eventIntervalMin, CONFIG.eventIntervalMax);
    await setTimeout(delay);
  }
  
  console.log('-------------------------------------------');
  console.log(`✅ Simulation complete. Sent ${eventCount} events in ${CONFIG.runTimeMinutes} minutes.`);
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Simulation interrupted. Shutting down gracefully...');
  process.exit(0);
});

// Start the simulator
runSimulator().catch(error => {
  console.error('❌ Fatal error in simulator:', error);
  process.exit(1);
}); 