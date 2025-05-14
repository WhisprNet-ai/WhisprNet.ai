# Slack Metadata Insights

This module extends WhisprNet.ai with Slack metadata analysis capabilities, leveraging LLM-based insights without processing message content, focusing solely on metadata patterns.

## Features

- **Slack Events API Integration**: Securely connect to Slack workspaces and collect metadata about communications
- **Privacy-First Analysis**: No message content is stored or processed, only metadata
- **LLM-Powered Insights**: Uses local Ollama for generating insights
- **Flexible Architecture**: Works with both direct Ollama calls or LangGraph agent orchestration
- **Configurable Analysis**: Control which metadata metrics are collected and analyzed
- **Automated Whisper Delivery**: Sends insights directly to designated workspace admins

## Metadata Collected

The system only collects and analyzes the following types of metadata:

- Message timestamps and frequencies
- Message length (character count)
- Emoji and reaction usage
- Thread participation patterns
- User activity patterns
- Channel activity distributions

## Architecture

### Components

1. **Slack Events API Integration**
   - OAuth-based authentication
   - Event subscription handling
   - Metadata extraction

2. **Metadata Collector**
   - Batched collection of events
   - Periodic analysis triggering
   - Organization-specific isolation

3. **LLM Analysis**
   - Ollama-based inference
   - Prompt system for metadata-only analysis
   - Insight extraction and formatting

4. **Agent Orchestration (Optional)**
   - LangGraph-based agent workflows
   - Multi-stage analysis with PulseAgent, LLMAgent, and WhisprAgent
   - Complex pattern recognition

5. **Whisper Delivery**
   - Slack DM delivery to organization admins
   - Structured feedback with suggested actions
   - Tracking of delivery status

## Setup

1. Configure your environment variables (see `.env.example`)
2. Ensure Ollama is running locally on the default port (11434)
3. Set up Slack app with appropriate scopes
   - channels:history
   - channels:read
   - chat:write
   - emoji:read
   - reactions:read
   - team:read
   - users:read

## API Endpoints

### Metadata Insights Configuration

- `GET /api/organizations/:organizationId/metadata-insights/slack/settings`
  - Get current metadata insights configuration for Slack

- `PUT /api/organizations/:organizationId/metadata-insights/slack/admin-settings`
  - Update admin user and config settings

- `PUT /api/organizations/:organizationId/metadata-insights/slack/toggle-insights`
  - Enable/disable insight generation

### Testing

- `POST /api/organizations/:organizationId/metadata-insights/slack/analyze`
  - Manually trigger analysis with example data for testing

## Ollama Setup

Make sure to pull the required model:

```bash
ollama pull mistral
```

## Architecture Decision Records

1. **Metadata-Only Processing**
   - All message content is stripped before processing
   - Only patterns in timing, frequency, and interaction are analyzed
   - Ensures compliance with privacy requirements

2. **Dual Analysis Modes**
   - Simple mode: Direct Ollama API calls
   - Advanced mode: Full LangGraph agent orchestration

3. **Scheduled Analysis**
   - Default: Analysis runs when batch size is reached or every 15 minutes
   - Configurable via environment variables

4. **Tenant Isolation**
   - All metadata and insights are isolated by organization
   - No cross-organization data sharing 