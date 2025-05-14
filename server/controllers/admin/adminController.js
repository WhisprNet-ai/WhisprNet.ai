import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import Whisper from '../../models/Whisper.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * @desc    Get admin dashboard metrics
 * @route   GET /api/admin/dashboard/metrics
 * @access  Private/Admin
 */
export const getAdminDashboardMetrics = asyncHandler(async (req, res) => {
  try {
    // Get total organizations count
    const totalOrganizations = await Organization.countDocuments();
    
    // Get active organizations count
    const activeOrganizations = await Organization.countDocuments({ isActive: true });
    
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get total whispers count
    const totalWhispers = await Whisper.countDocuments();
    
    // Calculate organization active percentage
    const activeOrganizationsPercent = totalOrganizations ? 
      Math.round((activeOrganizations / totalOrganizations) * 100) : 0;
    
    // System status - could be enhanced with actual health checks
    const systemStatus = {
      api: 'operational',
      database: 'operational',
      ml: 'operational'
    };
    
    // Return all metrics
    res.json({
      success: true,
      data: {
        totalOrganizations,
        activeOrganizations,
        activeOrganizationsPercent,
        totalUsers,
        totalWhispers,
        // Growth metrics would typically come from a time-series analysis
        // These are placeholders
        organizationGrowth: '+15%',
        userGrowth: '+25%',
        whisperGrowth: '+40%',
        systemStatus
      }
    });
  } catch (error) {
    console.error('Error getting admin dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching admin dashboard metrics'
    });
  }
});

/**
 * @desc    Get recent whispers across all organizations
 * @route   GET /api/admin/whispers/recent
 * @access  Private/Admin
 */
export const getRecentWhispers = asyncHandler(async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get recent whispers
    const whispers = await Whisper.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('organizationId', 'name');
    
    res.json({
      success: true,
      count: whispers.length,
      data: whispers
    });
  } catch (error) {
    console.error('Error getting recent whispers:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching recent whispers'
    });
  }
});

/**
 * @desc    Get total stats for all entities
 * @route   GET /api/admin/stats/totals
 * @access  Private/Admin
 */
export const getTotalStats = asyncHandler(async (req, res) => {
  try {
    // Get all counts
    const totalOrganizations = await Organization.countDocuments();
    const activeOrganizations = await Organization.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const totalWhispers = await Whisper.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalWhispers
      }
    });
  } catch (error) {
    console.error('Error getting total stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching total stats'
    });
  }
});

/**
 * @desc    Get system status
 * @route   GET /api/admin/system/status
 * @access  Private/Admin
 */
export const getSystemStatus = asyncHandler(async (req, res) => {
  try {
    // In a production system, this would include actual health checks
    const status = {
      api: 'operational',
      database: 'operational',
      ml: 'operational',
      cache: 'operational',
      workers: 'operational'
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching system status'
    });
  }
});

/**
 * @desc    Get user counts by organization
 * @route   GET /api/admin/users/counts
 * @access  Private/Admin
 */
export const getUserCounts = asyncHandler(async (req, res) => {
  try {
    // Aggregate user counts by organization
    const counts = await User.aggregate([
      {
        $group: {
          _id: '$organizationId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'organizations',
          localField: '_id',
          foreignField: '_id',
          as: 'organization'
        }
      },
      {
        $unwind: '$organization'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          organizationName: '$organization.name',
          isActive: '$organization.isActive'
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      count: counts.length,
      data: counts
    });
  } catch (error) {
    console.error('Error getting user counts by organization:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching user counts'
    });
  }
}); 