/**
 * Slack Delivery Service
 * Handles delivery of messages and insights to Slack channels/users
 */

import { formatSlackBlocks, getSlackClient, findWorkspaceAdmin, logSlackAction } from './utils.js';
import SlackConfig from '../../models/SlackConfig.js';
import Whisper from '../../models/Whisper.js';

/**
 * Deliver WhisprNet insights to an organization admin via Slack DM
 * @param {String} organizationId - The organization ID
 * @param {Object} whisperData - Whisper data to send
 * @returns {Object} - Result of sending the whisper
 */
export const deliverSlackInsight = async (organizationId, whisperData) => {
  try {
    logSlackAction('delivery', 'Starting whisper delivery', { 
      organizationId,
      title: whisperData.title
    });
    
    // Get the organization's Slack configuration
    const slackConfig = await SlackConfig.findOne({
      organization: organizationId,
      status: 'active'
    });
    
    logSlackAction('delivery', 'SlackConfig found', slackConfig ? 
      {
        id: slackConfig._id,
        botTokenExists: !!slackConfig.botToken,
        adminUserIdExists: !!slackConfig.adminUserId
      } : 
      { found: false }
    );
    
    if (!slackConfig || !slackConfig.botToken) {
      logSlackAction('delivery', 'No active Slack configuration found', { organizationId });
      throw new Error('No active Slack configuration found for this organization');
    }
    
    // Create Slack client
    const slackClient = await getSlackClient(organizationId);
    
    // Get the admin user or target from config
    let targetUser;
    let targetUserDetails = {};
    
    // First check if the slackConfig has an adminUserId 
    if (slackConfig.adminUserId) {
      targetUser = slackConfig.adminUserId;
      logSlackAction('delivery', 'Using configured admin user', { userId: targetUser });
      
      // Try to get user details for logging
      try {
        const userInfo = await slackClient.users.info({ user: targetUser });
        
        if (userInfo.ok) {
          targetUserDetails = {
            name: userInfo.user.name,
            isAdmin: userInfo.user.is_admin
          };
        }
      } catch (userLookupError) {
        logSlackAction('delivery', 'Could not fetch admin user details', { 
          error: userLookupError.message 
        });
      }
    } else {
      // Find a workspace admin
      logSlackAction('delivery', 'No configured admin, searching for workspace admins');
      
      try {
        const admin = await findWorkspaceAdmin(slackClient);
        
        targetUser = admin.id;
        targetUserDetails = {
          name: admin.name,
          isAdmin: true,
          isOwner: admin.is_owner || admin.is_primary_owner
        };
        
        logSlackAction('delivery', 'Found workspace admin', { 
          name: admin.name,
          id: admin.id
        });
        
        // Save the admin user ID to the SlackConfig for future use
        slackConfig.adminUserId = targetUser;
        await slackConfig.save();
        
        logSlackAction('delivery', 'Saved admin user ID to SlackConfig', { userId: targetUser });
      } catch (error) {
        logSlackAction('delivery', 'Error finding workspace admin', { error: error.message });
        throw error;
      }
    }
    
    // Format whisper for Slack
    const blocks = formatSlackBlocks(whisperData);
    
    logSlackAction('delivery', 'Sending DM to admin user', { targetUser });
    
    // Send the DM
    try {
      const result = await slackClient.chat.postMessage({
        channel: targetUser,
        blocks,
        text: `WhisprNet: ${whisperData.title}`,
        unfurl_links: false,
        unfurl_media: false
      });
      
      logSlackAction('delivery', 'Slack message result', result.ok ? 
        { success: true, ts: result.ts } : 
        { success: false, error: result.error }
      );
      
      if (result.ok) {
        logSlackAction('delivery', 'Successfully delivered whisper to admin', { 
          admin: targetUserDetails.name || targetUser 
        });
        
        // Record the delivery in Whisper if we have whisper details
        if (whisperData.whisperId) {
          await Whisper.findOneAndUpdate(
            { whisperId: whisperData.whisperId },
            { 
              $set: { 
                status: 'delivered',
                delivered: true,
                deliveredAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                  ...(whisperData.metadata || {}),
                  deliveryDetails: {
                    channel: result.channel,
                    target: targetUser,
                    targetType: 'admin',
                    messageId: result.ts
                  }
                }
              }
            },
            { upsert: false }
          );
        }
        
        return {
          success: true,
          messageId: result.ts,
          channel: result.channel,
          recipientDetails: targetUserDetails
        };
      } else {
        logSlackAction('delivery', 'Slack API error', { error: result.error });
        throw new Error(`Slack API error: ${result.error}`);
      }
    } catch (slackError) {
      logSlackAction('delivery', 'Error sending Slack message', { error: slackError.message });
      throw slackError;
    }
  } catch (error) {
    logSlackAction('delivery', 'Error delivering Slack insight', { error: error.message });
    return {
      success: false,
      error: error.message || 'Unknown error delivering Slack insight'
    };
  }
};

/**
 * Send a message to a specific Slack channel
 * @param {String} organizationId - Organization ID
 * @param {Object} messageData - Message data to send
 * @param {String} [channel='general'] - Target channel
 * @returns {Promise<Object>} - Result of sending the message
 */
export const sendSlackChannelMessage = async (organizationId, messageData, channel = 'general') => {
  try {
    logSlackAction('delivery', 'Sending channel message', { 
      organizationId,
      channel,
      title: messageData.title
    });
    
    // Get Slack client
    const slackClient = await getSlackClient(organizationId);
    
    // Format the message blocks
    const blocks = formatSlackBlocks(messageData);
    
    // Send the message
    const result = await slackClient.chat.postMessage({
      channel,
      blocks,
      text: messageData.title,
      unfurl_links: false,
      unfurl_media: false
    });
    
    if (!result.ok) {
      logSlackAction('delivery', 'Error sending channel message', { error: result.error });
      return {
        success: false,
        error: result.error
      };
    }
    
    logSlackAction('delivery', 'Successfully sent channel message', { 
      channel: result.channel,
      ts: result.ts
    });
    
    // Record the delivery in Whisper if we have whisper details
    if (messageData.whisperId) {
      await Whisper.findOneAndUpdate(
        { whisperId: messageData.whisperId },
        { 
          $set: { 
            status: 'delivered',
            delivered: true,
            deliveredAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...(messageData.metadata || {}),
              deliveryDetails: {
                channel: result.channel,
                target: channel,
                targetType: 'channel',
                messageId: result.ts
              }
            }
          }
        },
        { upsert: false }
      );
    }
    
    return {
      success: true,
      messageId: result.ts,
      channel: result.channel
    };
  } catch (error) {
    logSlackAction('delivery', 'Error sending channel message', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Deliver a whisper with fallback from admin DM to channel
 * @param {String} organizationId - Organization ID
 * @param {Object} whisperData - Whisper data
 * @returns {Promise<Object>} - Result of delivery
 */
export const deliverWhisperWithFallback = async (organizationId, whisperData) => {
  try {
    // First try to deliver to admin
    const result = await deliverSlackInsight(organizationId, whisperData);
    
    if (result.success) {
      return result;
    }
    
    // If admin delivery fails, try the fallback channel
    logSlackAction('delivery', 'Admin delivery failed, falling back to channel', { 
      error: result.error 
    });
    
    const fallbackResult = await sendSlackChannelMessage(
      organizationId, 
      whisperData, 
      whisperData.targetChannel || 'general'
    );
    
    return fallbackResult;
  } catch (error) {
    logSlackAction('delivery', 'Error in whisper delivery with fallback', { 
      error: error.message 
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}; 