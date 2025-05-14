import User from '../../models/User.js';
import Organization from '../../models/Organization.js';
import SlackConfig from '../../models/SlackConfig.js';
import Whisper from '../../models/Whisper.js';
import mongoose from 'mongoose';

/**
 * @desc    Get dashboard metrics
 * @route   GET /api/dashboard/metrics
 * @access  Private
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    console.log('Getting dashboard metrics for organization:', organizationId);

    // Get integration metrics
    // Count SlackConfig instances as integrations
    const slackConfigsCount = await SlackConfig.countDocuments({ organization: organizationId });
    const connectedSlackConfigsCount = await SlackConfig.countDocuments({ 
      organization: organizationId, 
      status: 'active' 
    });

    console.log('SlackConfig counts:', { total: slackConfigsCount, connected: connectedSlackConfigsCount });

    // Get whisper metrics - using Whisper instead of WhisprLog
    // Use $or to match on both organizationId and organization fields for compatibility
    const whispersCount = await Whisper.countDocuments({
      $or: [
        { organizationId },
        { organization: organizationId }
      ]
    });
    
    // Count whispers created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const whispersThisMonth = await Whisper.countDocuments({
      $or: [
        { organizationId, createdAt: { $gte: startOfMonth } },
        { organization: organizationId, createdAt: { $gte: startOfMonth } }
      ]
    });
    
    console.log('Whisper counts:', { total: whispersCount, thisMonth: whispersThisMonth });

    // Get team metrics
    const teamMembersCount = await User.countDocuments({ organizationId });
    const activeTeamMembersCount = await User.countDocuments({ 
      organizationId, 
      isActive: true 
    });
    
    console.log('Team metrics:', { total: teamMembersCount, active: activeTeamMembersCount });

    res.status(200).json({
      success: true,
      data: {
        integrations: {
          total: slackConfigsCount,
          connected: connectedSlackConfigsCount
        },
        whispers: {
          total: whispersCount,
          thisMonth: whispersThisMonth
        },
        teamMembers: {
          total: teamMembersCount,
          active: activeTeamMembersCount
        }
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard metrics'
    });
  }
};

/**
 * @desc    Get integration status summary
 * @route   GET /api/dashboard/integrations/status
 * @access  Private
 */
export const getIntegrationStatus = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Get SlackConfigs for the organization
    const slackConfigs = await SlackConfig.find({ organization: organizationId }).sort({ updatedAt: -1 });
    
    // Format integrations for response
    const formattedIntegrations = slackConfigs.map(config => {
      return {
        id: config._id,
        name: config.name || 'Slack Integration',
        type: 'slack',
        status: config.status === 'active' ? 'connected' : 'disconnected',
        icon: '💬',
        lastSync: config.lastSyncedAt,
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedIntegrations
    });
  } catch (err) {
    console.error('Error fetching integration status:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching integration status'
    });
  }
};

/**
 * @desc    Get recent activity
 * @route   GET /api/dashboard/activity
 * @access  Private
 */
export const getRecentActivity = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const limit = parseInt(req.query.limit) || 10;
    
    // Aggregate recent activities from different collections
    const [
      recentSlackConfigActivities,
      recentWhisperActivities,
      recentUserActivities
    ] = await Promise.all([
      // SlackConfig activities
      SlackConfig.find({ 
        organization: organizationId,
        updatedAt: { $exists: true }
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('name status updatedAt'),
      
      // Whisper activities from Whisper model (instead of WhisprLog)
      Whisper.find({
        $or: [
          { organizationId, createdAt: { $exists: true } },
          { organization: organizationId, createdAt: { $exists: true } }
        ]  
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title content.title createdAt'),
      
      // User activities (new members)
      User.find({ 
        organizationId, 
        createdAt: { $exists: true } 
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('firstName lastName email createdAt')
    ]);
    
    // Format integration activities
    const integrationActivities = recentSlackConfigActivities.map(activity => ({
      id: `sc-${activity._id}`,
      type: 'integration',
      message: `Slack integration ${activity.status === 'active' ? 'connected' : 'updated'}`,
      time: formatActivityTime(activity.updatedAt),
      timestamp: activity.updatedAt
    }));
    
    // Format whisper activities using Whisper properties
    const whisperActivities = recentWhisperActivities.map(activity => ({
      id: `whp-${activity._id}`,
      type: 'whisper',
      message: `New whisper "${activity.title || activity.content?.title || 'Untitled'}" created`,
      time: formatActivityTime(activity.createdAt),
      timestamp: activity.createdAt
    }));
    
    // Format user activities
    const userActivities = recentUserActivities.map(activity => ({
      id: `usr-${activity._id}`,
      type: 'user',
      message: `${activity.firstName} ${activity.lastName} joined the organization`,
      time: formatActivityTime(activity.createdAt),
      timestamp: activity.createdAt
    }));
    
    // Combine and sort all activities
    const allActivities = [
      ...integrationActivities,
      ...whisperActivities,
      ...userActivities
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
    
    res.status(200).json({
      success: true,
      data: allActivities
    });
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching recent activity'
    });
  }
};

/**
 * @desc    Get whisper stats
 * @route   GET /api/dashboard/whispers/stats
 * @access  Private
 */
export const getWhisperStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Get whisper stats from Whisper model
    const totalWhispers = await Whisper.countDocuments({
      $or: [
        { organizationId },
        { organization: organizationId }
      ]
    });
    
    // Count whispers by source from Whisper
    const whispersBySource = await Whisper.aggregate([
      { 
        $match: {
          $or: [
            { organizationId: new mongoose.Types.ObjectId(organizationId) },
            { organization: new mongoose.Types.ObjectId(organizationId) }
          ]
        } 
      },
      { $group: { _id: '$metadata.source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count whispers by category
    const whispersByCategory = await Whisper.aggregate([
      { 
        $match: {
          $or: [
            { organizationId: new mongoose.Types.ObjectId(organizationId) },
            { organization: new mongoose.Types.ObjectId(organizationId) }
          ]
        } 
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalWhispers,
        bySource: whispersBySource.map(item => ({
          source: item._id || 'unknown',
          count: item.count
        })),
        byCategory: whispersByCategory.map(item => ({
          category: item._id,
          count: item.count
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching whisper stats:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching whisper stats'
    });
  }
};

/**
 * @desc    Get team stats
 * @route   GET /api/dashboard/team/stats
 * @access  Private
 */
export const getTeamStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    // Get team stats
    const totalMembers = await User.countDocuments({ organizationId });
    
    // Count members by role
    const membersByRole = await User.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalMembers,
        byRole: membersByRole.map(item => ({
          role: item._id,
          count: item.count
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching team stats:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching team stats'
    });
  }
};

// Helper functions
const formatActivityTime = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now - activityTime;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}; 