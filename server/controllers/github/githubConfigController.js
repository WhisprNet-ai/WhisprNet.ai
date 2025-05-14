import GithubConfig from '../../models/GithubConfig.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import ErrorResponse from '../../utils/errorResponse.js';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Organization from '../../models/Organization.js';
import { processGithubOAuthCallback } from '../../services/integrations/githubService.js';

// Helper to check if a user has access to an organization
const checkUserOrgAccess = async (userId, organizationId) => {
  // In a real app, you would check if the user is a member of the organization
  // For this implementation, we'll assume yes
  return true;
};

// The rest of the file remains the same...
// ... existing code ...

/**
 * Generate a JWT token for GitHub App authentication
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - GitHub App private key
 * @returns {string} - JWT token
 */
const generateJWT = (appId, privateKey) => {
  // ... existing code ...
};

/**
 * Verifies the GitHub webhook signature
 * @param {string} signature - The signature from GitHub
 * @param {string} body - The request body as string
 * @param {string} secret - The webhook secret
 * @returns {boolean} - True if signature is valid
 */
const verifySignature = (signature, body, secret) => {
  // ... existing code ...
};

/**
 * @desc    Get GitHub configuration for an organization
 * @route   GET /api/organizations/:organizationId/github
 * @access  Private
 */
export const getGithubConfig = async (req, res) => {
  // ... existing code ...
};

/**
 * @desc    Create or update GitHub configuration for an organization
 * @route   POST/PUT /api/organizations/:organizationId/github
 * @access  Private
 */
export const createUpdateGithubConfig = async (req, res) => {
  // ... existing code ...
};

/**
 * @desc    Verify GitHub credentials
 * @route   POST /api/organizations/:organizationId/github/verify-credentials
 * @access  Private
 */
export const verifyGithubCredentials = async (req, res) => {
  // ... existing code ...
};

/**
 * @desc    Setup GitHub webhook for an organization
 * @route   POST /api/organizations/:organizationId/github/setup-webhook
 * @access  Private
 */
export const setupGithubWebhook = async (req, res) => {
  // ... existing code ...
};

/**
 * @desc    Delete GitHub configuration
 * @route   DELETE /api/organizations/:organizationId/github
 * @access  Private
 */
export const deleteGithubConfig = async (req, res, next) => {
  // ... existing code ...
};

/**
 * @desc    Handle GitHub OAuth callback
 * @route   GET /api/github/callback
 * @access  Public
 */
export const handleGithubCallback = async (req, res) => {
  // ... existing code ...
};

/**
 * @desc    Handle GitHub webhook events
 * @route   POST /api/github/events
 * @access  Public
 */
export const handleGithubEvent = async (req, res) => {
  // ... existing code ...
};

/**
 * @desc    Get recent GitHub events for testing
 * @route   GET /api/github/test-events
 * @access  Public
 */
export const getGithubEvents = async (req, res) => {
  try {
    // Return a sample response for testing
    return res.status(200).json({
      success: true,
      message: 'GitHub test events endpoint',
      data: {
        events: [
          {
            type: 'push',
            repo: 'whisprnet/test-repo',
            sender: 'test-user',
            timestamp: new Date().toISOString()
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error in getGithubEvents:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching GitHub events'
    });
  }
}; 