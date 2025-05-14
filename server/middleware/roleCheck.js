/**
 * Role-based access control middleware
 * Restricts access based on user role
 * @param {Array} roles - Allowed roles
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required'
      });
    }
    
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