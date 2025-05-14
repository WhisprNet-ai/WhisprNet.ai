# WhisprNet.ai Backend

WhisprNet.ai is an AI-powered platform that analyzes team communication patterns and development workflows to provide insights and recommendations that improve team collaboration and productivity.

## Architecture Overview

The WhisprNet.ai platform consists of the following major components:

- **API Server**: Express.js backend that handles user authentication, data storage, and client communication
- **Agent System**: LangChain-based AI agents that analyze metadata and generate insights
- **Integration Services**: Modular services that connect to communication and development platforms (Slack, GitHub)
- **Queue System**: BullMQ-based job scheduler for handling asynchronous processing
- **Data Store**: MongoDB for persistent storage and Redis for caching and queues

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- MongoDB
- Redis
- API keys for external services:
  - Slack (for Slack integration)
  - GitHub (for GitHub integration)
  - OpenAI or Mistral API key (for AI agents)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/whisprnet.ai.git
   cd whisprnet.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration settings:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/whisprnet
   
   # Redis Configuration
   REDIS_URI=redis://localhost:6379
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   
   # API URL (for callbacks)
   API_URL=http://localhost:3001
   
   # Slack Configuration
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   
   # GitHub Configuration
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Mistral Configuration
   MISTRAL_API_KEY=your_mistral_api_key
   
   # LLM Configuration
   LLM_MODEL_NAME=mistral
   ```

5. Start MongoDB and Redis services if not already running.

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## Project Structure

The project follows a modular architecture:

```
server/
├── config/           # Configuration files
├── controllers/      # API route handlers
├── middleware/       # Express middleware
├── models/           # MongoDB schemas
├── routes/           # API routes
├── services/         # Business logic
│   ├── agents/       # AI agent implementations
│   ├── github/       # GitHub integration services
│   ├── queue/        # BullMQ job queue setup
│   ├── redis/        # Redis client setup
│   └── slack/        # Slack integration services
├── utils/            # Utility functions
└── server.js         # Main application entry point
```

## API Documentation

The API follows RESTful design principles with standardized response formats:

### Success Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

### Authentication

Most API endpoints require authentication. Include a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

You can obtain a token by authenticating through the `/api/auth/login` endpoint.

## Integration Setup

### Slack Integration

1. Create a Slack app at https://api.slack.com/apps
2. Configure OAuth & Permissions with the following scopes:
   - `channels:history`
   - `channels:read`
   - `chat:write`
   - `emoji:read`
   - `reactions:read`
   - `team:read`
   - `users:read`
   - `users:read.email`
   - `im:read`
   - `im:write`
3. Set up Event Subscriptions with the URL: `https://your-api-url/api/slack/events/:organizationId`
4. Subscribe to the following events:
   - `message.channels`
   - `message.im`
   - `reaction_added`
   - `reaction_removed`
   - `channel_created`
   - `channel_rename`
   - `emoji_changed`

### GitHub Integration

1. Create a GitHub OAuth app at https://github.com/settings/developers
2. Set the Authorization callback URL to: `https://your-api-url/api/organizations/:organizationId/integrations/github/callback`
3. Configure webhook with the URL: `https://your-api-url/api/github/events`
4. Subscribe to the following events:
   - `push`
   - `pull_request`
   - `issues`
   - `issue_comment`
   - `pull_request_review`
   - `pull_request_review_comment`

## License

Proprietary and Confidential. Not for distribution. 