import asyncHandler from '../../middleware/asyncHandler.js';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/responseHandler.js';
import SlackMetadata from '../../models/SlackMetadata.js';
import GithubMetadata from '../../models/GithubMetadata.js';
import InsightScope from '../../models/InsightScope.js';

/**
 * @desc    Get metadata insights filtered by manager's scope
 * @route   GET /api/insights/metadata/:integration
 * @access  Private - Team Manager
 */
export const getScopedMetadataInsights = asyncHandler(async (req, res) => {
  const { integration } = req.params;
  const { _id: managerId, organizationId } = req.user;
  
  // Get manager's scope for this integration
  const scope = await InsightScope.findOne({
    managerId,
    organizationId,
    integration,
    isActive: true
  });
  
  if (!scope) {
    return notFoundResponse(res, 'No scope defined for this integration');
  }
  
  // Extract scope item IDs for query
  const scopeItemIds = scope.scopeItems.map(item => item.itemId);
  
  // Build query based on integration type
  let query = { organizationId };
  let Model;
  
  if (integration === 'slack') {
    Model = SlackMetadata;
    query.$or = [
      { userId: { $in: scopeItemIds } },
      { channelId: { $in: scopeItemIds } }
    ];
  } else if (integration === 'github') {
    Model = GithubMetadata;
    query.$or = [
      { userId: { $in: scopeItemIds } },
      { repoId: { $in: scopeItemIds } }
    ];
  } else {
    return errorResponse(res, `Unsupported integration: ${integration}`, 400);
  }
  
  // Add date range filter if provided
  if (req.query.startDate && req.query.endDate) {
    query.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  
  // Get metadata entries
  const metadata = await Model.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
  
  // Get total count
  const total = await Model.countDocuments(query);
  
  // Generate insights based on metadata
  const insights = await generateInsightsFromMetadata(metadata, integration);
  
  return successResponse(res, 'Scoped insights retrieved successfully', {
    insights,
    metadata: {
      count: metadata.length,
      total,
      page,
      pages: Math.ceil(total / limit)
    },
    scope: {
      id: scope._id,
      itemCount: scope.scopeItems.length
    }
  });
});

/**
 * @desc    Get aggregated metrics for scoped metadata
 * @route   GET /api/insights/metadata/:integration/metrics
 * @access  Private - Team Manager
 */
export const getScopedMetadataMetrics = asyncHandler(async (req, res) => {
  const { integration } = req.params;
  const { _id: managerId, organizationId } = req.user;
  
  // Get manager's scope for this integration
  const scope = await InsightScope.findOne({
    managerId,
    organizationId,
    integration,
    isActive: true
  });
  
  if (!scope) {
    return notFoundResponse(res, 'No scope defined for this integration');
  }
  
  // Extract scope item IDs
  const scopeItemIds = scope.scopeItems.map(item => item.itemId);
  
  // Define time range (default: last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  // Override with query params if provided
  if (req.query.startDate) startDate = new Date(req.query.startDate);
  if (req.query.endDate) endDate = new Date(req.query.endDate);
  
  // Build query based on integration
  let query = { 
    organizationId,
    timestamp: { $gte: startDate, $lte: endDate }
  };
  let Model, aggregations;
  
  if (integration === 'slack') {
    Model = SlackMetadata;
    query.$or = [
      { userId: { $in: scopeItemIds } },
      { channelId: { $in: scopeItemIds } }
    ];
    
    // Define Slack-specific aggregations
    aggregations = [
      // Message count by day
      {
        $match: query
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
  } else if (integration === 'github') {
    Model = GithubMetadata;
    query.$or = [
      { userId: { $in: scopeItemIds } },
      { repoId: { $in: scopeItemIds } }
    ];
    
    // Define GitHub-specific aggregations
    aggregations = [
      // Activity count by day
      {
        $match: query
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];
  } else {
    return errorResponse(res, `Unsupported integration: ${integration}`, 400);
  }
  
  // Execute aggregation
  const timeSeriesData = await Model.aggregate(aggregations);
  
  // Get total counts
  const totalCount = await Model.countDocuments(query);
  
  // Get event type breakdown
  const eventTypeBreakdown = await Model.aggregate([
    {
      $match: query
    },
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return successResponse(res, 'Scoped metrics retrieved successfully', {
    timeSeriesData,
    eventTypeBreakdown,
    totalCount,
    dateRange: {
      startDate,
      endDate
    },
    scope: {
      id: scope._id,
      itemCount: scope.scopeItems.length
    }
  });
});

/**
 * Generate insights from metadata
 * This is a placeholder function - in a real implementation 
 * this would use ML/AI services or complex analytics
 */
const generateInsightsFromMetadata = async (metadata, integration) => {
  // Basic insights generation logic
  const insights = [];
  
  if (integration === 'slack') {
    // Most active hours
    const hourCounts = {};
    metadata.forEach(item => {
      if (item.hourOfDay !== undefined) {
        hourCounts[item.hourOfDay] = (hourCounts[item.hourOfDay] || 0) + 1;
      }
    });
    
    let maxHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxHour = hour;
        maxCount = count;
      }
    }
    
    if (maxCount > 0) {
      insights.push({
        type: 'activity_pattern',
        title: 'Peak Activity Time',
        insight: `Most activity occurs at ${maxHour}:00 with ${maxCount} messages`
      });
    }
    
    // Weekend activity
    const weekendCount = metadata.filter(item => item.isWeekend).length;
    const weekendPercentage = (weekendCount / metadata.length) * 100;
    
    if (weekendPercentage > 10) {
      insights.push({
        type: 'work_balance',
        title: 'Weekend Activity',
        insight: `${weekendPercentage.toFixed(1)}% of communication happens on weekends`
      });
    }
  } else if (integration === 'github') {
    // Add GitHub specific insights
  }
  
  return insights;
};

export default {
  getScopedMetadataInsights,
  getScopedMetadataMetrics
}; 