import axios from 'axios';
import GithubConfig from '../../models/GithubConfig.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new GitHub integration using GithubConfig model
 * @param {string} organizationId - Organization ID
 * @param {string} name - Integration name
 * @returns {Promise<Object>} - GithubConfig object
 */
export const createGithubIntegration = async (organizationId, name) => {
  try {
    // Check if a config already exists
    let githubConfig = await GithubConfig.findOne({ organization: organizationId });
    
    if (githubConfig) {
      return githubConfig;
    }
    
    // Create a new config
    githubConfig = await GithubConfig.create({
      organization: organizationId,
      name: name || 'GitHub Integration',
      status: 'pending'
    });
    
    return githubConfig;
  } catch (error) {
    console.error('Error creating GitHub integration:', error);
    throw new Error('Failed to create GitHub integration');
  }
};

/**
 * Process a GitHub OAuth callback, exchanging a code for an access token
 * @param {string} code - The authorization code from GitHub
 * @param {string} organizationId - The organization ID
 * @returns {Object} Result with success flag and data/error
 */
export const processGithubOAuthCallback = async (code, organizationId) => {
  try {
    console.log(`Processing GitHub OAuth callback for org ${organizationId} with code ${code.substring(0, 5)}...`);
    
    // Find the GitHub configuration for this organization
    const githubConfig = await GithubConfig.findOne({ organization: organizationId });
    
    if (!githubConfig) {
      return {
        success: false,
        error: 'GitHub configuration not found'
      };
    }
    
    console.log(`GitHub config found, using clientId: ${githubConfig.clientId}`);
    console.log(`Attempting to exchange OAuth code for access token...`);
    
    // Define the token request payload
    const payload = {
      client_id: githubConfig.clientId,
      client_secret: githubConfig.clientSecret,
      code
    };

    console.log('Token request payload:', {
      clientId: githubConfig.clientId,
      clientSecret: '[MASKED]',
      codeLength: code.length
    });
    
    // Get host URL
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    const redirectUrl = `${baseUrl}/api/organizations/${organizationId}/integrations/github/callback`;
    console.log(`Using redirect URL: ${redirectUrl}`);
    
    try {
      // Exchange the code for an access token
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          ...payload,
          redirect_uri: redirectUrl
        },
        { headers: { Accept: 'application/json' } }
      );
      
      console.log('Token response received:', {
        status: response.status,
        hasAccessToken: !!response.data.access_token,
        data: response.data.access_token ? 
          { tokenType: response.data.token_type, scope: response.data.scope } : 
          response.data
      });
      
      if (response.data.access_token) {
        // Save the access token to the GitHub config
        githubConfig.accessToken = response.data.access_token;
        githubConfig.verificationStatus = 'verified';
        githubConfig.verifiedAt = new Date();
        await githubConfig.save();
        
        return {
          success: true,
          token: response.data.access_token
        };
      } else {
        // If there's no access token, there was an error
        console.error('Failed to obtain GitHub access token, response:', response.data);
        
        githubConfig.verificationStatus = 'failed';
        githubConfig.verificationError = `Access token not returned in response: ${JSON.stringify(response.data)}`;
        await githubConfig.save();
        
        return {
          success: false,
          error: `Failed to obtain GitHub access token`
        };
      }
    } catch (error) {
      console.error('Failed to obtain GitHub access token', error.response?.data || error.message);
      
      githubConfig.verificationStatus = 'failed';
      githubConfig.verificationError = error.response?.data?.error_description || error.message;
      await githubConfig.save();
      
      return {
        success: false,
        error: `Failed to obtain GitHub access token: ${error.response?.data?.error_description || error.message}`
      };
    }
  } catch (error) {
    console.error('Error processing GitHub OAuth callback:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process a GitHub webhook event
 * @param {Object} event - The normalized event data
 * @param {string} organizationId - The organization ID
 */
export const processGithubEvent = async (event, organizationId) => {
  try {
    console.log(`Processing GitHub event for organization ${organizationId}`);
    console.log(`Event type: ${event.eventType}`);
    
    // In a real implementation, this would:
    // 1. Send the event to a queue for async processing
    // 2. Trigger associated workflows or agents
    // 3. Store event data for reporting/analytics
    
    // For now, just log it
    console.log('Event processed successfully');
    return true;
  } catch (error) {
    console.error('Error processing GitHub event:', error);
    return false;
  }
};

/**
 * Update GitHub config with auth tokens
 * @param {string} code - OAuth code
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} - Success status and updated config
 */
export const saveGithubTokens = async (code, organizationId) => {
  try {
    // Find the GitHub config
    const githubConfig = await GithubConfig.findOne({ organization: organizationId });
    
    if (!githubConfig) {
      return {
        success: false,
        error: 'GitHub configuration not found'
      };
    }
    
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    const { access_token, scope, token_type } = response.data;
    
    if (!access_token) {
      return {
        success: false,
        error: 'Failed to obtain GitHub access token'
      };
    }
    
    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`
      }
    });
    
    // Update configuration
    githubConfig.accessToken = access_token;
    githubConfig.status = 'active';
    githubConfig.lastSyncedAt = new Date();
    
    if (userResponse.data && userResponse.data.login) {
      githubConfig.githubOrgName = userResponse.data.login;
    }
    
    if (userResponse.data && userResponse.data.id) {
      githubConfig.githubOrgId = userResponse.data.id.toString();
    }
    
    await githubConfig.save();
    
    return {
      success: true,
      config: githubConfig.toSanitized()
    };
  } catch (error) {
    console.error('Error saving GitHub tokens:', error);
    return {
      success: false,
      error: `Failed to save GitHub tokens: ${error.message}`
    };
  }
};

/**
 * Fetch repositories using GitHub config
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} - List of repositories
 */
export const fetchGithubRepositories = async (organizationId) => {
  try {
    const githubConfig = await GithubConfig.findOne({ organization: organizationId });
    
    if (!githubConfig || !githubConfig.accessToken) {
      throw new Error('GitHub integration not properly configured');
    }
    
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${githubConfig.accessToken}`
      },
      params: {
        sort: 'updated',
        per_page: 100
      }
    });
    
    return response.data.map(repo => ({
      id: repo.id,
      name: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      stars: repo.stargazers_count,
      language: repo.language
    }));
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw new Error(`Failed to fetch GitHub repositories: ${error.message}`);
  }
};

/**
 * Synchronize repository data from GitHub
 * @param {string} organizationId - Organization ID
 * @param {Array} repositories - Repository names to sync
 * @returns {Promise<Object>} - Sync results
 */
export const syncGithubData = async (organizationId, repositories) => {
  try {
    const githubConfig = await GithubConfig.findOne({ organization: organizationId });
    
    if (!githubConfig || !githubConfig.accessToken) {
      throw new Error('GitHub integration not properly configured');
    }
    
    // Update last synced timestamp
    githubConfig.lastSyncedAt = new Date();
    await githubConfig.save();
    
    // This would be implemented to fetch issues, PRs, etc.
    // and process them in an actual implementation
    
    return {
      success: true,
      syncedAt: githubConfig.lastSyncedAt,
      message: 'GitHub data synchronized successfully'
    };
  } catch (error) {
    console.error('Error syncing GitHub data:', error);
    return {
      success: false,
      error: `Failed to sync GitHub data: ${error.message}`
    };
  }
};

/**
 * Process GitHub events into metadata for agent consumption
 * @param {Object} event - The GitHub event object
 * @param {String} organizationId - The organization ID
 * @returns {Object} - Processed metadata
 */
export const getGithubMetadata = async (event, organizationId) => {
  try {
    // Only process metadata, not full content (for privacy)
    let metadata = {};
    
    // Process different event types
    switch (event.type) {
      case 'push':
        metadata = processPushMetadata(event, organizationId);
        break;
      case 'pull_request':
        metadata = processPullRequestMetadata(event, organizationId);
        break;
      case 'issues':
        metadata = processIssueMetadata(event, organizationId);
        break;
      default:
        // For other events, extract basic metadata
        metadata = {
          eventId: uuidv4(),
          source: 'github',
          eventType: event.type,
          timestamp: new Date(event.created_at || event.updated_at || Date.now()),
          repoName: event.repository?.name,
          repoId: event.repository?.id,
          senderId: event.sender?.id,
          senderType: event.sender?.type,
          organizationId,
          metadata_type: 'development_activity'
        };
    }
    
    return metadata;
  } catch (error) {
    console.error('Error processing GitHub metadata:', error);
    throw error;
  }
};

/**
 * Process push event metadata
 */
const processPushMetadata = (event, organizationId) => {
  return {
    eventId: uuidv4(),
    source: 'github',
    eventType: 'push',
    metadata_type: 'commit_activity',
    timestamp: new Date(event.created_at || event.head_commit?.timestamp || Date.now()),
    repoName: event.repository?.name,
    repoId: event.repository?.id,
    senderId: event.sender?.id,
    senderType: event.sender?.type,
    ref: event.ref,
    refType: event.ref_type,
    branchName: event.ref?.replace('refs/heads/', ''),
    commitCount: event.commits?.length || 0,
    isDefaultBranch: event.repository?.default_branch === event.ref?.replace('refs/heads/', ''),
    organizationId
  };
};

/**
 * Process pull request event metadata
 */
const processPullRequestMetadata = (event, organizationId) => {
  const pr = event.pull_request;
  return {
    eventId: uuidv4(),
    source: 'github',
    eventType: 'pull_request',
    metadata_type: 'pr_lifecycle',
    timestamp: new Date(pr?.updated_at || pr?.created_at || Date.now()),
    repoName: event.repository?.name,
    repoId: event.repository?.id,
    senderId: event.sender?.id,
    senderType: event.sender?.type,
    prNumber: pr?.number,
    prAction: event.action,
    prState: pr?.state,
    baseBranch: pr?.base?.ref,
    headBranch: pr?.head?.ref,
    isDraft: pr?.draft || false,
    isMerged: pr?.merged || false,
    additionsCount: pr?.additions || 0,
    deletionsCount: pr?.deletions || 0,
    changedFilesCount: pr?.changed_files || 0,
    reviewCount: pr?.review_comments || 0,
    comments: pr?.comments || 0,
    organizationId
  };
};

/**
 * Process issue event metadata
 */
const processIssueMetadata = (event, organizationId) => {
  const issue = event.issue;
  return {
    eventId: uuidv4(),
    source: 'github',
    eventType: 'issue',
    metadata_type: 'issue_tracking',
    timestamp: new Date(issue?.updated_at || issue?.created_at || Date.now()),
    repoName: event.repository?.name,
    repoId: event.repository?.id,
    senderId: event.sender?.id,
    senderType: event.sender?.type,
    issueNumber: issue?.number,
    issueAction: event.action,
    issueState: issue?.state,
    issueLabels: issue?.labels?.map(l => l.name) || [],
    hasAssignees: (issue?.assignees?.length || 0) > 0,
    commentCount: issue?.comments || 0,
    organizationId
  };
}; 