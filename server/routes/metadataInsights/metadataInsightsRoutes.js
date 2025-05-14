import express from 'express';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';
import SlackConfig from '../../models/SlackConfig.js';
import { asyncHandler } from '../../middleware/async.js';
import ErrorResponse from '../../utils/errorResponse.js';
import Whisper from '../../models/Whisper.js';

const router = express.Router({ mergeParams: true });

// Apply middleware to protect routes
router.use(authenticate);
router.use(enforceTenantIsolation);

/**
 * @desc    Update Slack admin settings for metadata insights
 * @route   PUT /api/organizations/:organizationId/metadata-insights/slack/admin-settings
 * @access  Private
 */
router.put('/slack/admin-settings', asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;
  const { adminUserId, enabledChannels, enabledMetrics } = req.body;
  
  // Find the Slack configuration for this organization
  const slackConfig = await SlackConfig.findOne({
    organization: organizationId
  });
  
  if (!slackConfig) {
    return next(new ErrorResponse('Slack configuration not found', 404));
  }
  
  // Update admin settings
  slackConfig.adminUserId = adminUserId;
  slackConfig.enabledChannels = enabledChannels || [];
  slackConfig.enabledMetrics = enabledMetrics || [
    'messageFrequency',
    'responseTime',
    'emojiUsage',
    'threadActivity',
    'userEngagement'
  ];
  
  await slackConfig.save();
  
  res.status(200).json({
    success: true,
    data: slackConfig.toSanitized()
  });
}));

/**
 * @desc    Get Slack metadata insights settings
 * @route   GET /api/organizations/:organizationId/metadata-insights/slack/settings
 * @access  Private
 */
router.get('/slack/settings', asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;
  
  // Find the Slack configuration for this organization
  const slackConfig = await SlackConfig.findOne({
    organization: organizationId
  });
  
  if (!slackConfig) {
    return next(new ErrorResponse('Slack configuration not found', 404));
  }
  
  // Return metadata insights config
  res.status(200).json({
    success: true,
    data: {
      metadataInsightsEnabled: slackConfig.status === 'active',
      adminUserId: slackConfig.adminUserId,
      enabledChannels: slackConfig.enabledChannels || [],
      enabledMetrics: slackConfig.enabledMetrics || []
    }
  });
}));

/**
 * @desc    Toggle Slack insights
 * @route   PUT /api/organizations/:organizationId/metadata-insights/slack/toggle-insights
 * @access  Private
 */
router.put('/slack/toggle-insights', asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;
  const { enabled } = req.body;
  
  // Find the Slack configuration for this organization
  const slackConfig = await SlackConfig.findOne({
    organization: organizationId
  });
  
  if (!slackConfig) {
    return next(new ErrorResponse('Slack configuration not found', 404));
  }
  
  // Update enabled status - active/inactive based on enabled flag
  slackConfig.status = enabled ? 'active' : 'inactive';  
  await slackConfig.save();
  
  res.status(200).json({
    success: true,
    data: {
      metadataInsightsEnabled: slackConfig.status === 'active',
      config: slackConfig.toSanitized()
    }
  });
}));

/**
 * @desc    Manually trigger Slack metadata analysis
 * @route   POST /api/organizations/:organizationId/metadata-insights/slack/analyze
 * @access  Private
 */
router.post('/slack/analyze', asyncHandler(async (req, res, next) => {
  const { organizationId } = req.params;
  
  // Import necessary functions
  const { generateSlackInsight, formatInsightToWhisper } = await import('../../services/ollama/ollamaService.js');
  const { deliverSlackInsight } = await import('../../services/integrations/slackMetadataService.js');
  
  // Get example metadata (in a real implementation, this would come from the metadata collector)
  const exampleMetadata = [
    {
      eventId: 'evt_12345',
      source: 'slack',
      eventType: 'message',
      subtype: 'regular',
      timestamp: new Date(),
      channelId: 'C12345',
      userId: 'U12345',
      teamId: 'T12345',
      hasAttachments: false,
      hasEmoji: true,
      messageLength: 120,
      threadTs: null,
      isInThread: false,
      hasEdits: false,
      organizationId
    },
    {
      eventId: 'evt_12346',
      source: 'slack',
      eventType: 'reaction',
      reactionType: 'thumbsup',
      timestamp: new Date(Date.now() - 60000),
      channelId: 'C12345',
      userId: 'U12346',
      itemUserId: 'U12345',
      teamId: 'T12345',
      itemType: 'message',
      itemTs: '1612345678.123456',
      organizationId
    }
  ];
  
  try {
    // Generate insight
    const insightResult = await generateSlackInsight(exampleMetadata);
    
    if (!insightResult.success) {
      return next(new ErrorResponse(`Failed to generate insight: ${insightResult.error}`, 500));
    }
    
    // Format whisper
    const whisperData = formatInsightToWhisper(insightResult.insight, exampleMetadata);
    
    // Create whisper in database using the normalized Whisper model
    const whisper = new Whisper({
      whisperId: `whspr_${Date.now()}${Math.floor(Math.random() * 10000)}`,
      organizationId,
      title: whisperData.title,
      category: whisperData.category,
      priority: whisperData.category === 'warning' ? 2 : 3, // High for warnings, medium for others
      content: {
        message: whisperData.message,
        suggestedActions: whisperData.suggestedActions || []
      },
      metadata: {
        source: 'slack',
        confidence: whisperData.confidence,
        dataPoints: {
          target: whisperData.targetType,
          metadataCount: exampleMetadata.length,
          model: insightResult.model
        }
      },
      status: 'pending',
      channel: 'slack_dm'
    });
    
    await whisper.save();
    
    // Deliver to Slack
    const deliveryResult = await deliverSlackInsight(organizationId, {
      title: whisperData.title,
      message: whisperData.message,
      suggestedActions: whisperData.suggestedActions || [],
      whisperId: whisper.whisperId
    });
    
    // Update whisper status
    if (deliveryResult.success) {
      await Whisper.findOneAndUpdate(
        { whisperId: whisper.whisperId },
        {
          status: 'delivered',
          delivered: true,
          deliveredAt: new Date(),
          metadata: {
            ...whisper.metadata,
            deliveryDetails: {
              channel: deliveryResult.channel || 'slack_dm',
              target: 'admin',
              targetType: 'user'
            }
          }
        }
      );
    } else {
      await Whisper.findOneAndUpdate(
        { whisperId: whisper.whisperId },
        { status: 'failed' }
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        whisperId: whisper.whisperId,
        insight: insightResult.insight,
        delivery: deliveryResult.success ? 'delivered' : 'failed'
      }
    });
  } catch (error) {
    console.error('Error in manual analysis:', error);
    return next(new ErrorResponse(`Analysis failed: ${error.message}`, 500));
  }
}));

export default router; 