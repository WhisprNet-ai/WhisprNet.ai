# Redis and BullMQ Implementation for Slack Metadata Collection

This document explains how Redis and BullMQ are used to implement a scalable, persistent metadata collection and analysis system for WhisprNet.ai.

## Overview

The system collects Slack metadata (timestamps, user activity patterns, etc.) and processes it in batches to generate insights. The previous implementation used in-memory Map objects, which had several limitations:

- Data would be lost on server restart
- Could not scale horizontally across multiple server instances
- No fault tolerance or recovery mechanism
- No persistence

The new implementation addresses these issues using Redis for coordination and MongoDB for storage, with BullMQ for job scheduling and processing.

## Architecture

### Components

1. **Redis** - Used for:
   - Metadata counter tracking per organization
   - Delayed job scheduling flags
   - BullMQ job queue backend

2. **MongoDB** - Used for:
   - Persistent storage of all metadata
   - Storing processing status for each metadata item

3. **BullMQ** - Used for:
   - Scheduling immediate and delayed metadata analysis jobs
   - Managing retry logic for failed analysis attempts
   - Ensuring job processing across distributed instances

4. **SlackMetadata Model** - MongoDB schema for storing metadata with:
   - Multi-tenant isolation via organizationId
   - Processing status tracking
   - Indexing for efficient queries

## Flow

1. **Metadata Reception**:
   - Slack events are received via webhook
   - Only metadata is extracted (no message content)
   - Metadata is saved to MongoDB as 'pending'
   - Redis counter for the organization is incremented

2. **Job Scheduling**:
   - If counter reaches threshold (100,000), immediate analysis is triggered
   - Otherwise, delayed analysis is scheduled (8 hours) if not already scheduled
   - Redis flags track scheduling state

3. **Job Processing**:
   - Worker retrieves all pending metadata for an organization
   - Runs analysis using existing agent workflow
   - Updates metadata status to 'processed'
   - Resets Redis counters and flags

4. **Error Handling**:
   - Failed jobs are automatically retried with exponential backoff
   - Job state is preserved in Redis for recovery

## Configuration

### Redis Connection

Redis connection is configured via environment variables:
- `REDIS_HOST` - Redis host (default: localhost) 
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number (default: 0)

### BullMQ Worker Options

Worker behavior can be configured via environment variables:
- `QUEUE_CONCURRENCY` - Default worker concurrency (default: 3)
- `SLACK_ANALYSIS_CONCURRENCY` - Concurrency for Slack analysis jobs (default: 2)

## Key Redis Data Structures

- **Counter Key**: `slack:org:{orgId}:count` - Tracks number of metadata items pending analysis
- **Delayed Flag Key**: `slack:org:{orgId}:delayed` - Indicates if a delayed job is scheduled

## Required Dependencies

```json
{
  "dependencies": {
    "bullmq": "^5.1.1",
    "ioredis": "^5.3.2"
  }
}
```

## Scaling Considerations

- Multiple server instances can share the same Redis instance and MongoDB database
- BullMQ ensures that jobs are distributed across workers
- Job deduplication is handled by using organization ID as job ID
- For high-volume deployments, consider Redis cluster or sentinel setup

## Graceful Shutdown

The system implements graceful shutdown handling:
- Close BullMQ queues, workers, and schedulers 
- Close Redis connections
- Allow pending jobs to complete before shutdown

## Future Enhancements

- Implement monitoring dashboard for job queues
- Add metrics collection for job processing statistics
- Implement auto-scaling based on queue length
- Add job priority based on metadata type 