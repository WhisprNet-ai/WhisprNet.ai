import ManagerPermission from '../models/ManagerPermission.js';
import InsightScope from '../models/InsightScope.js';
import { sendForbidden } from '../utils/responseHandler.js';

/**
 * Middleware to check if user has manager permissions for an integration
 * @param {String|Array} integrations - Integration(s) to check permissions for
 * @returns {Function} Express middleware
 */
export const checkManagerPermission = (integrations) => {
  const integrationsArray = Array.isArray(integrations) ? integrations : [integrations];
  
  return async (req, res, next) => {
    try {
      // Only check for team_manager role
      if (req.user.role !== 'team_manager') {
        return next();
      }
      
      const { _id: userId, organizationId } = req.user;
      
      // Check if manager has permission for specified integrations
      const permission = await ManagerPermission.findOne({
        managerId: userId,
        organizationId,
        allowedIntegrations: { $in: integrationsArray },
        isActive: true
      });
      
      if (!permission) {
        return sendForbidden(res, 'You do not have permission for this integration');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can access a specific whisper based on scope
 * @returns {Function} Express middleware
 */
export const checkWhisperScopeAccess = () => {
  return async (req, res, next) => {
    try {
      // Skip checks for admins
      if (['org_admin', 'super_admin'].includes(req.user.role)) {
        return next();
      }
      
      const whisper = req.whisper || req.locals?.whisper;
      
      // If no whisper is found in the request, skip (let the controller handle it)
      if (!whisper) {
        return next();
      }
      
      // Team managers can only access whispers in their scope
      if (req.user.role === 'team_manager') {
        // If whisper has no scope, it's an org-wide whisper
        if (!whisper.scopeInfo || !whisper.scopeInfo.managerId) {
          return next();
        }
        
        // Check if the whisper is in this manager's scope
        if (whisper.scopeInfo.managerId.toString() !== req.user._id.toString()) {
          return sendForbidden(res, 'You do not have access to this whisper');
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can access metadata based on scope
 * @param {String} integration - Integration type to check
 * @returns {Function} Express middleware
 */
export const checkMetadataScopeAccess = (integration) => {
  return async (req, res, next) => {
    try {
      // Skip checks for admins
      if (['org_admin', 'super_admin'].includes(req.user.role)) {
        return next();
      }
      
      // Only apply to team managers
      if (req.user.role !== 'team_manager') {
        return next();
      }
      
      const { _id: userId, organizationId } = req.user;
      
      // Get manager's scope for this integration
      const scope = await InsightScope.findOne({
        managerId: userId,
        organizationId,
        integration,
        isActive: true
      });
      
      // No scope defined means no access
      if (!scope) {
        return sendForbidden(res, 'You do not have a defined scope for this integration');
      }
      
      // Add scope to request for use in controller
      req.managerScope = scope;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  checkManagerPermission,
  checkWhisperScopeAccess,
  checkMetadataScopeAccess
}; 