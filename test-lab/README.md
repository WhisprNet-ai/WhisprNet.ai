# WhisprNet.ai Slack Test Lab

A synthetic Slack event generator for testing WhisprNet.ai's metadata analysis pipeline.

## Purpose

This test lab simulates Slack workspace activity to test the end-to-end flow:
- Synthetic event ingestion
- BullMQ queue processing
- Agentic insight generation

The simulator generates realistic team interactions that would trigger WhisprNet's whisper agents, without requiring an actual Slack workspace.

## Features

- Simulates 5 different Slack event types: `message.posted`, `reaction_added`, `emoji_used`, `message.edited`, `channel_joined`
- Uses synthetic personas: Senior Engineer, Junior Engineer, Project Manager, and DevOps Bot
- Runs for a configurable duration (default: 10 minutes)
- Sends events at randomized intervals (1-3 seconds)
- Simulates a realistic workday scenario with:
  - Morning standup meetings
  - Question-answer patterns with delays
  - Bot notifications
  - Late-night activity (potential burnout pattern)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure the simulator in `slackEventSimulator.js`:
   ```javascript
   const CONFIG = {
     runTimeMinutes: 10,                      // Duration of the simulation
     eventIntervalMin: 1000,                  // Min interval between events (ms)
     eventIntervalMax: 3000,                  // Max interval between events (ms)
     targetUrl: 'http://localhost:3000/api/slack/events/{{organizationId}}',
     organizationId: 'org_12345',             // Replace with your org ID
   };
   ```

3. Ensure your WhisprNet.ai server is running locally.

## Running the Simulator

```
node slackEventSimulator.js
```

The simulator will:
1. First run a predefined scenario to simulate a realistic workday
2. Then continue generating random events until the time limit is reached
3. Gracefully shut down after the specified runtime

## Output

The simulator provides detailed console logs about each event sent:

```
🚀 Starting WhisprNet.ai Slack Event Simulator
⏱️  Running for 10 minutes
🎯 Target URL: http://localhost:3000/api/slack/events/org_12345
👥 Using synthetic personas: SENIOR_ENGINEER, JUNIOR_ENGINEER, PROJECT_MANAGER, DEVOPS_BOT
-------------------------------------------
🎬 Starting scenario simulation
📅 Morning standup - PM activity
📤 Sending message.posted from Maya Patel in #engineering
✅ Event sent successfully: 200
...
```

## Integration with WhisprNet.ai

This test lab is designed to help test:

1. **Metadata Processing**: Ensure WhisprNet.ai properly extracts metadata from Slack events
2. **Queue Processing**: Verify BullMQ job queue functionality works with real events
3. **Insight Generation**: Test the agentic system's ability to detect patterns and generate whispers

## Customization

You can extend the simulator by:

- Adding more event types in the `EVENT_TYPES` array
- Creating new personas in the `PERSONAS` object
- Modifying the scenario in the `simulateScenario()` function
- Adjusting the event payload structure in the event creation functions

## Troubleshooting

If events are not being received:
- Check that your WhisprNet.ai server is running
- Verify the `targetUrl` is correct
- Confirm that your organization ID is valid
- Look for any CORS or authentication issues in the server logs 