# WhisprNet.ai Organization Admin UI

This is the Organization Admin UI for WhisprNet.ai. It allows organizations to manage their integrations with services like Gmail, GitHub, and Slack for AI-powered processing.

## Features

- **Integration Management**: Connect and configure integrations with Gmail, GitHub, Slack, and more
- **Detailed Settings**: Fine-grained control over how each integration behaves
- **Dashboard**: Overview of connected services and recent activity
- **Organization Settings**: Manage organization preferences, notifications, and security settings

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-dir>/client/org-admin-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to http://localhost:3001

## Project Structure

```
/src
  /components        # Reusable UI components
  /pages             # Page components for routing
  /services          # API services and utilities
  /hooks             # Custom React hooks
  /contexts          # React context providers
  /utils             # Utility functions
```

## Development

This project uses:
- React 18 for UI components
- React Router v6 for routing
- TailwindCSS for styling
- Vite for build and development

## Integration Configuration

Each integration (Gmail, GitHub, Slack) requires API credentials from the respective services:

- **Gmail**: Requires OAuth 2.0 credentials from Google Cloud Console
- **GitHub**: Requires a GitHub App or OAuth App credentials
- **Slack**: Requires a Slack App with appropriate permissions

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## License

[License details] 