/**
 * Whisper Controller
 * Handles CRUD operations for Whispers
 */

import Joi from 'joi';
import mongoose from 'mongoose';
import Whisper from '../../models/Whisper.js';
import { createCrudController, controller, isValidObjectId } from '../../utils/controllerUtils.js';
import { sendSuccess, sendError, sendNotFound, sendForbidden } from '../../utils/responseHandler.js';
import { deliverSlackInsight, sendSlackChannelMessage } from '../../services/slack/delivery.js';

// Validation schemas
const createWhisperSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  category: Joi.string().valid('improvement', 'optimization', 'health', 'collaboration', 'recognition'),
  priority: Joi.number().integer().min(1).max(5),
  content: Joi.object({
    message: Joi.string().required().min(10),
    suggestedActions: Joi.array().items(Joi.string()),
    rationale: Joi.string()
  }).required(),
  deliver: Joi.boolean().default(false),
  deliveryTarget: Joi.string().valid('admin', 'channel', 'manager').default('admin'),
  channelName: Joi.string().when('deliveryTarget', {
    is: 'channel',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  scopeInfo: Joi.object({
    managerId: Joi.string(),
    scopeId: Joi.string(),
    integration: Joi.string(),
    sourceItems: Joi.array().items(Joi.object({
      itemId: Joi.string().required(),
      itemType: Joi.string().required()
    }))
  })
});

const updateWhisperSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  category: Joi.string().valid('improvement', 'optimization', 'health', 'collaboration', 'recognition'),
  priority: Joi.number().integer().min(1).max(5),
  status: Joi.string().valid('pending', 'delivered', 'failed', 'archived'),
  content: Joi.object({
    message: Joi.string().min(10),
    suggestedActions: Joi.array().items(Joi.string()),
    rationale: Joi.string()
  })
});

const feedbackSchema = Joi.object({
  isHelpful: Joi.boolean().required(),
  comment: Joi.string().allow('', null)
});

// Base CRUD controller
const crudController = createCrudController(Whisper, {
  listFields: '-metadata',
  detailFields: '',
  searchFields: ['title', 'content.message'],
  filterFields: ['category', 'priority', 'status', 'source'],
  createSchema: createWhisperSchema,
  updateSchema: updateWhisperSchema
});

// Get all whispers for an organization, respecting scope permissions
export const getWhispers = controller(async (req, res) => {
  // Get organization ID from params
  const { organizationId } = req.params;
  const { _id: userId, role } = req.user;
  
  console.log('Fetching whispers for organization:', organizationId);
  
  // Build query
  let query = { organizationId };
  
  // If user is team_manager, limit to whispers in their scope
  if (role === 'team_manager') {
    query.$or = [
      { 'scopeInfo.managerId': userId },
      { scopeInfo: { $exists: false } } // Include org-wide whispers that have no scope
    ];
  }
  
  // Handle search
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    const searchQuery = {
      $or: [
        { title: searchRegex },
        { 'content.message': searchRegex }
      ]
    };
    
    // Combine with existing query
    if (query.$or) {
      query = {
        $and: [
          { $or: query.$or },
          searchQuery
        ]
      };
    } else {
      Object.assign(query, searchQuery);
    }
  }
  
  // Handle filters
  ['category', 'priority', 'status', 'source'].forEach(field => {
    if (req.query[field]) {
      query[field] = req.query[field];
    }
  });
  
  // Pagination options
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const skip = (page - 1) * limit;
  
  // Sorting options
  const sort = req.query.sort || '-createdAt';
  
  console.log('Query:', JSON.stringify(query));
  
  // Execute query
  const whispers = await Whisper.find(query)
    .select('-metadata')
    .populate('scopeInfo.managerId', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  console.log(`Retrieved ${whispers.length} whispers`);
  
  // Get total count for pagination that matches the filter criteria
  const total = await Whisper.countDocuments(query);
  
  sendSuccess(res, 'Whispers retrieved successfully', {
    results: whispers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get a single whisper, with scope permission check
export const getWhisper = controller(async (req, res) => {
  const { organizationId, id } = req.params;
  const { _id: userId, role } = req.user;
  
  // Validate organization and whisper ID
  if (!isValidObjectId(organizationId)) {
    return sendError(res, 'Invalid organization ID', 400);
  }
  
  const whisper = await Whisper.findOne({
    _id: id,
    organizationId
  }).populate('scopeInfo.managerId', 'firstName lastName email');
  
  if (!whisper) {
    return sendNotFound(res, 'Whisper not found');
  }
  
  // Check if user has access to this whisper
  if (role === 'team_manager' && 
      whisper.scopeInfo && 
      whisper.scopeInfo.managerId && 
      whisper.scopeInfo.managerId.toString() !== userId.toString()) {
    return sendForbidden(res, 'You do not have access to this whisper');
  }
  
  sendSuccess(res, 'Whisper retrieved successfully', whisper);
});

// Create a new whisper
export const createWhisper = controller(async (req, res) => {
  const { organizationId } = req.params;
  const { deliver, deliveryTarget, channelName, scopeInfo, ...whisperData } = req.body;
  
  // Add additional metadata
  whisperData.source = 'manual';
  whisperData.organizationId = organizationId;
  whisperData.metadata = {
    generatedBy: req.user ? req.user.name : 'api',
    generatedAt: new Date()
  };
  
  // Handle scope information if provided
  if (scopeInfo) {
    whisperData.scopeInfo = scopeInfo;
  }
  
  // Create the whisper
  const whisper = await Whisper.create(whisperData);
  
  // Deliver the whisper if requested
  if (deliver) {
    try {
      const deliveryData = {
        title: whisper.title,
        message: whisper.content.message,
        suggestedActions: whisper.content.suggestedActions || []
      };
      
      let deliveryResult;
      
      if (deliveryTarget === 'channel' && channelName) {
        // Deliver to specific channel
        deliveryResult = await sendSlackChannelMessage(
          organizationId,
          deliveryData,
          channelName
        );
      } else if (deliveryTarget === 'manager' && whisper.scopeInfo && whisper.scopeInfo.managerId) {
        // Deliver to team manager
        deliveryResult = await deliverSlackInsight(
          organizationId,
          deliveryData,
          whisper.scopeInfo.managerId
        );
      } else {
        // Deliver to admin
        deliveryResult = await deliverSlackInsight(organizationId, deliveryData);
      }
      
      // Update whisper status based on delivery result
      if (deliveryResult.success) {
        whisper.status = 'delivered';
        whisper.deliveredAt = new Date();
        await whisper.save();
      } else {
        whisper.status = 'failed';
        await whisper.save();
      }
      
      sendSuccess(res, 'Whisper created and delivered', {
        whisper,
        delivery: {
          success: deliveryResult.success,
          target: deliveryResult.channel || 'unknown'
        }
      }, 201);
    } catch (error) {
      whisper.status = 'failed';
      await whisper.save();
      
      sendSuccess(res, 'Whisper created but delivery failed', {
        whisper,
        delivery: {
          success: false,
          error: error.message
        }
      }, 201);
    }
  } else {
    sendSuccess(res, 'Whisper created successfully', whisper, 201);
  }
}, createWhisperSchema);

// Update a whisper
export const updateWhisper = controller(async (req, res) => {
  const { organizationId, id } = req.params;
  const { _id: userId, role } = req.user;
  
  // First, check if user has access to this whisper
  const whisper = await Whisper.findOne({
    _id: id,
    organizationId
  });
  
  if (!whisper) {
    return sendNotFound(res, 'Whisper not found');
  }
  
  // Check if user has permission to update this whisper
  if (role === 'team_manager' && 
      whisper.scopeInfo && 
      whisper.scopeInfo.managerId && 
      whisper.scopeInfo.managerId.toString() !== userId.toString()) {
    return sendForbidden(res, 'You do not have permission to update this whisper');
  }
  
  // Update the whisper
  const updatedWhisper = await Whisper.findOneAndUpdate(
    { _id: id, organizationId },
    req.body,
    { new: true, runValidators: true }
  );
  
  sendSuccess(res, 'Whisper updated successfully', updatedWhisper);
}, updateWhisperSchema);

// Delete a whisper
export const deleteWhisper = controller(async (req, res) => {
  const { organizationId, id } = req.params;
  const { _id: userId, role } = req.user;
  
  // First, check if user has access to this whisper
  const whisper = await Whisper.findOne({
    _id: id,
    organizationId
  });
  
  if (!whisper) {
    return sendNotFound(res, 'Whisper not found');
  }
  
  // Check if user has permission to delete this whisper
  if (role === 'team_manager' && 
      whisper.scopeInfo && 
      whisper.scopeInfo.managerId && 
      whisper.scopeInfo.managerId.toString() !== userId.toString()) {
    return sendForbidden(res, 'You do not have permission to delete this whisper');
  }
  
  // Delete the whisper
  await Whisper.findOneAndDelete({ 
    _id: id, 
    organizationId 
  });
  
  sendSuccess(res, 'Whisper deleted successfully');
});

// Submit feedback for a whisper
export const submitFeedback = controller(async (req, res) => {
  const { organizationId, id } = req.params;
  const { isHelpful, comment } = req.body;
  const { _id: userId, role } = req.user;
  
  const whisper = await Whisper.findOne({ 
    _id: id, 
    organizationId 
  });
  
  if (!whisper) {
    return sendNotFound(res, 'Whisper not found');
  }
  
  // Check if user has permission to provide feedback on this whisper
  if (role === 'team_manager' && 
      whisper.scopeInfo && 
      whisper.scopeInfo.managerId && 
      whisper.scopeInfo.managerId.toString() !== userId.toString()) {
    return sendForbidden(res, 'You do not have permission to provide feedback on this whisper');
  }
  
  // Update feedback
  whisper.feedback = {
    isHelpful,
    comment,
    submittedBy: req.user ? req.user._id : null,
    submittedAt: new Date()
  };
  
  await whisper.save();
  
  sendSuccess(res, 'Feedback submitted successfully', whisper);
}, feedbackSchema);

// Re-deliver a whisper
export const deliverWhisper = controller(async (req, res) => {
  const { organizationId, id } = req.params;
  const { target, channelName } = req.body;
  const { _id: userId, role } = req.user;
  
  const whisper = await Whisper.findOne({ 
    _id: id, 
    organizationId 
  });
  
  if (!whisper) {
    return sendNotFound(res, 'Whisper not found');
  }
  
  // Check if user has permission to deliver this whisper
  if (role === 'team_manager' && 
      whisper.scopeInfo && 
      whisper.scopeInfo.managerId && 
      whisper.scopeInfo.managerId.toString() !== userId.toString()) {
    return sendForbidden(res, 'You do not have permission to deliver this whisper');
  }
  
  try {
    const deliveryData = {
      title: whisper.title,
      message: whisper.content.message,
      suggestedActions: whisper.content.suggestedActions || []
    };
    
    let deliveryResult;
    
    if (target === 'channel' && channelName) {
      // Deliver to specific channel
      deliveryResult = await sendSlackChannelMessage(
        organizationId,
        deliveryData,
        channelName
      );
    } else if (target === 'manager' && whisper.scopeInfo && whisper.scopeInfo.managerId) {
      // Deliver to team manager
      deliveryResult = await deliverSlackInsight(
        organizationId,
        deliveryData,
        whisper.scopeInfo.managerId
      );
    } else {
      // Deliver to admin
      deliveryResult = await deliverSlackInsight(organizationId, deliveryData);
    }
    
    // Update whisper status based on delivery result
    if (deliveryResult.success) {
      whisper.status = 'delivered';
      whisper.deliveredAt = new Date();
      await whisper.save();
      
      sendSuccess(res, 'Whisper delivered successfully', {
        success: true,
        target: deliveryResult.channel || 'admin'
      });
    } else {
      sendError(res, 'Failed to deliver whisper', 400, {
        error: deliveryResult.error
      });
    }
  } catch (error) {
    sendError(res, 'Error delivering whisper', 500, {
      error: error.message
    });
  }
});

// Get recent whispers for dashboard
export const getRecentWhispers = controller(async (req, res) => {
  const { organizationId } = req.params;
  const { _id: userId, role } = req.user;
  const limit = parseInt(req.query.limit, 10) || 5;
  
  let whispers;
  
  if (role === 'org_admin' || role === 'super_admin') {
    // Org admins can see all whispers
    whispers = await Whisper.getRecent(organizationId, limit);
  } else if (role === 'team_manager') {
    // Team managers see only their scoped whispers
    whispers = await Whisper.getManagerWhispers(userId, organizationId, limit);
  } else {
    // Regular users see org-wide whispers
    whispers = await Whisper.find({ 
      organizationId,
      scopeInfo: { $exists: false }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-metadata');
  }
  
  sendSuccess(res, 'Recent whispers retrieved successfully', whispers);
});

// Get whisper statistics
export const getWhisperStats = controller(async (req, res) => {
  const { organizationId } = req.params;
  const { _id: userId, role } = req.user;
  
  // Build query based on user role
  let query = { organizationId };
  
  if (role === 'team_manager') {
    query.$or = [
      { 'scopeInfo.managerId': userId },
      { scopeInfo: { $exists: false } }
    ];
  }
  
  // Get total count
  const total = await Whisper.countDocuments(query);
  
  // Get counts by category
  const categoryStats = await Whisper.aggregate([
    { $match: query },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  // Format category stats
  const categories = {};
  categoryStats.forEach(stat => {
    categories[stat._id] = stat.count;
  });
  
  // Get recent trends (weekly)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const timeQuery = {
    ...query,
    createdAt: { $gte: lastMonth }
  };
  
  const weeklyTrends = await Whisper.aggregate([
    { $match: timeQuery },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ]);
  
  // For org admins, get stats by team/manager
  let scopeDistribution = [];
  
  if (role === 'org_admin' || role === 'super_admin') {
    scopeDistribution = await Whisper.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: { $ifNull: ['$scopeInfo.managerId', null] },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'managerInfo'
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          managerName: {
            $cond: {
              if: { $eq: ['$_id', null] },
              then: 'Organization-wide',
              else: {
                $concat: [
                  { $arrayElemAt: ['$managerInfo.firstName', 0] },
                  ' ',
                  { $arrayElemAt: ['$managerInfo.lastName', 0] }
                ]
              }
            }
          }
        }
      }
    ]);
  }
  
  sendSuccess(res, 'Whisper statistics retrieved successfully', {
    total,
    categories,
    recentTrends: weeklyTrends.map(trend => ({
      year: trend._id.year,
      week: trend._id.week,
      count: trend.count
    })),
    scopeDistribution: scopeDistribution.map(item => ({
      managerId: item._id,
      name: item.managerName || 'Unknown',
      count: item.count
    }))
  });
}); 