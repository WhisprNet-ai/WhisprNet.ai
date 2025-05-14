/**
 * Controller Utilities
 * Provides utilities for building standardized controllers
 */

import { sendError, sendSuccess, sendCreated, sendNotFound, sendValidationError } from './responseHandler.js';
import mongoose from 'mongoose';
import Joi from 'joi';

/**
 * Enhanced async handler with validation support
 * @param {Function} handler - The handler function
 * @param {Object} schema - Optional Joi validation schema
 * @returns {Function} - Express middleware function
 */
export const controller = (handler, schema = null) => {
  return async (req, res, next) => {
    try {
      // Validate request data if schema is provided
      if (schema) {
        const validationSource = req.method === 'GET' ? req.query : req.body;
        const { error, value } = schema.validate(validationSource, { 
          abortEarly: false,
          stripUnknown: true 
        });
        
        if (error) {
          const errors = error.details.reduce((acc, detail) => {
            acc[detail.context.key] = detail.message;
            return acc;
          }, {});
          
          return sendValidationError(res, 'Validation failed', errors);
        }
        
        // Update req with validated data
        if (req.method === 'GET') {
          req.query = value;
        } else {
          req.body = value;
        }
      }
      
      // Execute the handler function
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Create a CRUD controller for a Mongoose model
 * @param {Model} Model - Mongoose model
 * @param {Object} options - Controller options
 * @returns {Object} - CRUD controller functions
 */
export const createCrudController = (Model, options = {}) => {
  const {
    listFields = '', 
    detailFields = '',
    defaultSort = '-createdAt',
    populateFields = [],
    searchFields = [],
    filterFields = [],
    createSchema = null,
    updateSchema = null
  } = options;
  
  return {
    // Get all resources with filtering, sorting and pagination
    getAll: controller(async (req, res) => {
      // Build query
      let query = {};
      
      // Filter by organization if needed (tenant isolation)
      if (req.organizationId && Model.schema.paths.organizationId) {
        query.organizationId = req.organizationId;
      }
      
      // Handle search
      if (req.query.search && searchFields.length > 0) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = searchFields.map(field => ({ [field]: searchRegex }));
      }
      
      // Handle filters
      filterFields.forEach(field => {
        if (req.query[field]) {
          query[field] = req.query[field];
        }
      });
      
      // Pagination options
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 25;
      const skip = (page - 1) * limit;
      
      // Sorting options
      const sort = req.query.sort || defaultSort;
      
      // Execute query
      let queryBuilder = Model.find(query)
        .select(listFields)
        .sort(sort)
        .skip(skip)
        .limit(limit);
        
      // Handle population of related fields
      populateFields.forEach(field => {
        if (typeof field === 'string') {
          queryBuilder = queryBuilder.populate(field);
        } else {
          queryBuilder = queryBuilder.populate(field.path, field.select);
        }
      });
      
      const results = await queryBuilder;
      
      // Get total count for pagination
      const total = await Model.countDocuments(query);
      
      sendSuccess(res, 'Resources retrieved successfully', {
        results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }),
    
    // Get a single resource by ID
    getById: controller(async (req, res) => {
      let query = { _id: req.params.id };
      
      // Filter by organization if needed (tenant isolation)
      if (req.organizationId && Model.schema.paths.organizationId) {
        query.organizationId = req.organizationId;
      }
      
      let queryBuilder = Model.findOne(query).select(detailFields);
      
      // Handle population of related fields
      populateFields.forEach(field => {
        if (typeof field === 'string') {
          queryBuilder = queryBuilder.populate(field);
        } else {
          queryBuilder = queryBuilder.populate(field.path, field.select);
        }
      });
      
      const result = await queryBuilder;
      
      if (!result) {
        return sendNotFound(res, 'Resource not found');
      }
      
      sendSuccess(res, 'Resource retrieved successfully', result);
    }),
    
    // Create a new resource
    create: controller(async (req, res) => {
      // Add organization ID if needed
      if (req.organizationId && Model.schema.paths.organizationId) {
        req.body.organizationId = req.organizationId;
      }
      
      const result = await Model.create(req.body);
      sendCreated(res, 'Resource created successfully', result);
    }, createSchema),
    
    // Update an existing resource
    update: controller(async (req, res) => {
      let query = { _id: req.params.id };
      
      // Filter by organization if needed (tenant isolation)
      if (req.organizationId && Model.schema.paths.organizationId) {
        query.organizationId = req.organizationId;
      }
      
      const result = await Model.findOneAndUpdate(
        query,
        req.body,
        { new: true, runValidators: true }
      ).select(detailFields);
      
      if (!result) {
        return sendNotFound(res, 'Resource not found');
      }
      
      sendSuccess(res, 'Resource updated successfully', result);
    }, updateSchema),
    
    // Delete a resource
    delete: controller(async (req, res) => {
      let query = { _id: req.params.id };
      
      // Filter by organization if needed (tenant isolation)
      if (req.organizationId && Model.schema.paths.organizationId) {
        query.organizationId = req.organizationId;
      }
      
      const result = await Model.findOneAndDelete(query);
      
      if (!result) {
        return sendNotFound(res, 'Resource not found');
      }
      
      sendSuccess(res, 'Resource deleted successfully');
    })
  };
};

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {String} id - ID to check
 * @returns {Boolean} - Whether the ID is valid
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Get a single document by ID with proper error handling
 * @param {Model} Model - Mongoose model
 * @param {String} id - Document ID
 * @param {String} message - Error message if not found
 * @param {Object} options - Additional options (populate, select)
 * @returns {Promise<Document>} - The document
 */
export const getDocumentById = async (Model, id, message = 'Resource not found', options = {}) => {
  if (!isValidObjectId(id)) {
    const error = new Error(`Invalid ID format: ${id}`);
    error.statusCode = 400;
    throw error;
  }
  
  let query = Model.findById(id);
  
  if (options.select) {
    query = query.select(options.select);
  }
  
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach(field => {
        query = query.populate(field);
      });
    } else {
      query = query.populate(options.populate);
    }
  }
  
  const document = await query;
  
  if (!document) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }
  
  return document;
}; 