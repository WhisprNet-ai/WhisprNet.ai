import express from 'express';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';
import AgentSession from '../../models/AgentSession.js';
import Whisper from '../../models/Whisper.js';
import { runDynamicAgentWorkflow } from '../../services/agents/dynamicAgentWorkflow.js';

const router = express.Router({ mergeParams: true });

// Apply middleware to protect routes
router.use(authenticate);
router.use(enforceTenantIsolation);

// @desc    Trigger an agent workflow run
// @route   POST /api/organizations/:organizationId/agents/run
// @access  Private
router.post('/run', async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { metadata } = req.body;
    
    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Metadata array is required and cannot be empty'
      });
    }
    
    // Run the agent workflow
    const result = await runDynamicAgentWorkflow(organizationId, metadata);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Agent workflow failed'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: result.sessionId,
        whisperCount: result.whisperCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all agent sessions for an organization
// @route   GET /api/organizations/:organizationId/agents/sessions
// @access  Private
router.get('/sessions', async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    
    const sessions = await AgentSession.find({ organizationId })
      .sort({ startTime: -1 })
      .select('sessionId agentType status startTime endTime duration metadata');
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get a single agent session
// @route   GET /api/organizations/:organizationId/agents/sessions/:sessionId
// @access  Private
router.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const { organizationId, sessionId } = req.params;
    
    const session = await AgentSession.findOne({ organizationId, sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Agent session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all whispers for an organization with pagination and filters
// @route   GET /api/organizations/:organizationId/agents/whispers
// @access  Private
router.get('/whispers', async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    
    // Optional query filters
    const { category, priority, source, status, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { organizationId };
    if (category) query.category = category;
    if (priority) {
      // Handle numeric or string priority
      if (!isNaN(priority)) {
        query.priority = parseInt(priority);
      } else {
        query.priorityText = priority;
      }
    }
    if (source) query['metadata.source'] = source;
    if (status) query.status = status;
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Execute query
    const total = await Whisper.countDocuments(query);
    const whispers = await Whisper.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: parseInt(page) + 1,
        limit: parseInt(limit)
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: parseInt(page) - 1,
        limit: parseInt(limit)
      };
    }
    
    res.status(200).json({
      success: true,
      count: whispers.length,
      pagination,
      data: whispers
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a whisper
// @route   DELETE /api/organizations/:organizationId/agents/whispers/:whisperId
// @access  Private
router.delete('/whispers/:whisperId', async (req, res, next) => {
  try {
    const { organizationId, whisperId } = req.params;
    
    const whisper = await Whisper.findOne({ organizationId, whisperId });
    
    if (!whisper) {
      return res.status(404).json({
        success: false,
        error: 'Whisper not found'
      });
    }
    
    await whisper.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update whisper feedback
// @route   PUT /api/organizations/:organizationId/agents/whispers/:whisperId/feedback
// @access  Private
router.put('/whispers/:whisperId/feedback', async (req, res, next) => {
  try {
    const { organizationId, whisperId } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating is required and must be between 1 and 5'
      });
    }
    
    const whisper = await Whisper.findOne({ organizationId, whisperId });
    
    if (!whisper) {
      return res.status(404).json({
        success: false,
        error: 'Whisper not found'
      });
    }
    
    // Update the feedback in the new structure
    whisper.feedback = {
      isHelpful: rating >= 3, // Consider 3+ as helpful
      rating: rating,
      comment: comment,
      submittedBy: req.user._id,
      submittedAt: new Date()
    };
    
    await whisper.save();
    
    res.status(200).json({
      success: true,
      data: whisper
    });
  } catch (error) {
    next(error);
  }
});

export default router; 