import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

dotenv.config();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check if token exists in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No authentication token provided'
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET || 'somesecretkey'
    );
    
    console.log('JWT Decoded:', {
      id: decoded.id,
      iat: decoded.iat,
      exp: decoded.exp,
      tokenExpiresIn: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log(`User with ID ${decoded.id} not found in database`);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User no longer exists'
      });
    }
    
    console.log('User authenticated:', {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : null
    });
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: User account has been deactivated'
      });
    }
    
    // Check if user is a super_admin (super_admins don't require organization checks)
    if (user.role === 'super_admin') {
      // Super admin users - bypass organization check
      req.user = user;
      // Still try to get the organization if it exists, but don't require it
      if (user.organizationId) {
        const organization = await Organization.findById(user.organizationId);
        if (organization) {
          req.organization = organization;
        }
      }
    } else {
      // Organization users (org_admin and org_user) - check if organization exists and is active
      const organization = await Organization.findById(user.organizationId);
      
      if (!organization) {
        console.log(`Organization with ID ${user.organizationId} not found`);
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Organization not found'
        });
      }
      
      if (!organization.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Organization has been deactivated'
        });
      }
      
      console.log('Organization found:', {
        id: organization._id.toString(),
        name: organization.name,
        isActive: organization.isActive
      });
      
      // Attach user and organization to request
      req.user = user;
      req.organization = organization;
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

/**
 * Tenant isolation middleware
 * Ensures users can only access their organization's resources
 */
export const enforceTenantIsolation = (req, res, next) => {
  // Get organization ID from route params or query
  const routeOrgId = req.params.organizationId || req.query.organizationId;
  
  // If organizationId is in the request and doesn't match user's organizationId,
  // and user is not a super_admin, deny access
  if (
    routeOrgId && 
    routeOrgId !== req.user.organizationId.toString() && 
    req.user.role !== 'super_admin'
  ) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: You can only access resources belonging to your organization'
    });
  }
  
  next();
};

/**
 * Role-based access control middleware
 * Restricts access based on user role
 * @param {Array} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorizing user:', req.user);
    console.log(roles);
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role ${req.user.role} is not authorized to access this resource`
      });
    }
    
    next();
  };
};

/**
 * API key authentication middleware
 * For server-to-server and integration use cases
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: API key required'
      });
    }
    
    // Find organization by API key
    const organization = await Organization.findByApiKey(apiKey);
    
    if (!organization) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API key'
      });
    }
    
    // Check if organization is active
    if (!organization.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Organization has been deactivated'
      });
    }
    
    // Find an admin user of the organization
    const adminUser = await User.findOne({
      organizationId: organization._id,
      role: { $in: ['org_admin', 'super_admin'] },
      isActive: true
    });
    
    if (!adminUser) {
      return res.status(500).json({
        success: false,
        error: 'No active admin user found for this organization'
      });
    }
    
    // Attach organization and admin user to request
    req.organization = organization;
    req.user = adminUser;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during API key authentication'
    });
  }
}; 