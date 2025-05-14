import { WebClient } from '@slack/web-api';
import SlackConfig from '../models/SlackConfig.js';
import asyncHandler from '../middleware/asyncHandler.js';
import axios from 'axios';

// Simple in-memory cache with expiration
const responseCache = {
  data: new Map(),
  // Cache responses for 15 minutes
  ttl: 15 * 60 * 1000,
  
  // Get cached response
  get(key) {
    if (!this.data.has(key)) return null;
    
    const { value, timestamp } = this.data.get(key);
    const now = Date.now();
    
    // Check if expired
    if (now - timestamp > this.ttl) {
      this.data.delete(key);
      return null;
    }
    
    return value;
  },
  
  // Set cache entry
  set(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now()
    });
  },
  
  // Clear all entries or a specific entry
  clear(key) {
    if (key) {
      this.data.delete(key);
    } else {
      this.data.clear();
    }
  }
};

/**
 * @desc    Get all users from Slack workspace using direct Slack API
 * @route   GET /api/slack/users
 * @access  Private - Org Admin, Team Manager
 */
export const getSlackUsers = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const forceRefresh = req.query.force_refresh === 'true';
  
  // Generate cache key
  const cacheKey = `slack_users_${organizationId}`;
  
  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = responseCache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        count: cachedData.users.length,
        users: cachedData.users,
        fromCache: true,
        cachedAt: cachedData.timestamp
      });
    }
  }
  
  try {
    // Get Slack configuration from database
    const slackConfig = await SlackConfig.findOne({ organizationId });
    
    if (!slackConfig) {
      return res.status(404).json({
        success: false,
        error: 'Slack configuration not found for this organization'
      });
    }
    
    // Prioritize bot token over access token
    const token = slackConfig.botToken || slackConfig.accessToken;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No Slack token found. Please configure Slack integration.'
      });
    }
    
    // For pagination and performance tracking
    let allUsers = [];
    let nextCursor = null;
    let totalApiCalls = 0;
    
    do {
      totalApiCalls++;
      
      // Implement pagination
      const url = 'https://slack.com/api/users.list' + (nextCursor ? `?cursor=${nextCursor}` : '');
      
      // Make direct API call with axios
      const response = await axios({
        method: 'get',
        url: url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }
      
      // Add users from this page to our collection
      allUsers = [...allUsers, ...response.data.members];
      
      // Get next cursor for pagination
      nextCursor = response.data.response_metadata?.next_cursor;
      
    } while (nextCursor);
    
    // Process and filter Slack users
    const users = allUsers
      .filter(user => !user.is_bot && !user.deleted && user.id !== 'USLACKBOT')
      .map(user => ({
        id: user.id,
        name: user.real_name || user.name,
        email: user.profile?.email,
        avatar: user.profile?.image_192 || user.profile?.image_72,
        is_admin: user.is_admin || false,
        title: user.profile?.title || '',
        status: user.profile?.status_text || '',
        tz: user.tz_label || '',
        team_id: user.team_id,
        updated: user.updated
      }));
    
    // Cache the response
    const responseData = {
      users,
      timestamp: new Date().toISOString()
    };
    responseCache.set(cacheKey, responseData);
    
    // Return the processed users
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
      fromCache: false,
      timestamp: responseData.timestamp
    });
  } catch (error) {
    // Return appropriate error based on the error type
    if (error.message?.includes('Slack API error')) {
      // Handle specific Slack API errors
      const errorMessage = error.message.replace('Slack API error: ', '');
      
      switch (errorMessage) {
        case 'not_authed':
        case 'invalid_auth':
          return res.status(401).json({
            success: false,
            error: 'Invalid Slack authentication token'
          });
        case 'token_expired':
          return res.status(401).json({
            success: false,
            error: 'Slack token has expired'
          });
        case 'missing_scope':
          return res.status(403).json({
            success: false,
            error: 'Slack token is missing required scopes (users:read)'
          });
        case 'rate_limited':
          return res.status(429).json({
            success: false,
            error: 'Rate limited by Slack API, please try again later'
          });
        default:
          return res.status(500).json({
            success: false,
            error: `Slack API error: ${errorMessage}`
          });
      }
    }
    
    // Default error response
    return res.status(500).json({
      success: false,
      error: 'Error fetching Slack users'
    });
  }
});

export default {
  getSlackUsers
}; 