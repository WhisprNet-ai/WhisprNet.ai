import Organization from '../models/Organization.js';
import User from '../models/User.js';

/**
 * Check if a user has access to a specific organization
 * @param {string} userId - The user ID to check
 * @param {string} organizationId - The organization ID to check access for
 * @returns {Promise<boolean>} - Returns true if the user has access
 */
export const checkUserOrgAccess = async (userId, organizationId) => {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) return false;

    // Admin users have access to all organizations
    if (user.role === 'org_admin') return true;

    // For non-admin users, check if they belong to the organization
    const org = await Organization.findOne({
      _id: organizationId,
      $or: [
        { owner: userId },
        { members: { $elemMatch: { user: userId } } }
      ]
    });

    return !!org;
  } catch (error) {
    console.error('Error checking user organization access:', error);
    return false;
  }
}; 