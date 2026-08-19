const User = require('../models/User');

/**
 * Recursively find all direct and indirect subordinate user IDs for a given manager ID.
 * This ensures the hierarchy can scale infinitely (CEO -> Director -> Manager -> Lead -> Exec).
 */
const getSubordinateIds = async (managerId) => {
  const directSubordinates = await User.find({ managerId: managerId }).select('_id');
  const subordinateIds = directSubordinates.map((sub) => sub._id);

  let allSubordinates = [...subordinateIds];

  for (const subId of subordinateIds) {
    const deeperSubs = await getSubordinateIds(subId);
    allSubordinates = allSubordinates.concat(deeperSubs);
  }

  return allSubordinates;
};

/**
 * Returns an array of User ObjectIds that the given user has permission to view/manage.
 * - Main Person (Level 1): Can see everyone across the entire organization.
 * - Middle Person (Level 2): Can see themselves and all subordinates under their subtree.
 * - Last Person (Level 3): Can ONLY see themselves.
 */
const getAccessibleUserIds = async (user) => {
  if (user.role === 'ceo' || user.role === 'main' || user.level === 1) {
    const allUsers = await User.find().select('_id');
    return allUsers.map((u) => u._id.toString());
  }

  if (user.role === 'manager' || user.role === 'middle' || user.level === 2) {
    const subordinateIds = await getSubordinateIds(user._id);
    return [user._id.toString(), ...subordinateIds.map((id) => id.toString())];
  }

  // Employee (Level 3) only has access to their own data
  return [user._id.toString()];
};

/**
 * Checks if requesting user can access target user's data based on hierarchy.
 */
const canAccessUser = async (requestingUser, targetUserId) => {
  const targetIdStr = targetUserId.toString();
  const requestingIdStr = requestingUser._id.toString();

  if (requestingIdStr === targetIdStr) return true;
  if (requestingUser.role === 'ceo' || requestingUser.role === 'main' || requestingUser.level === 1) return true;

  const accessibleIds = await getAccessibleUserIds(requestingUser);
  return accessibleIds.includes(targetIdStr);
};

/**
 * Express Middleware to ensure the authenticated user can access the target resource owner.
 */
const checkHierarchyAccess = (getTargetUserId = (req) => req.params.userId || req.query.userId || req.body.userId) => {
  return async (req, res, next) => {
    try {
      const targetUserId = getTargetUserId(req);
      if (!targetUserId) {
        return next();
      }

      const hasAccess = await canAccessUser(req.user, targetUserId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to view or manage employees outside your reporting hierarchy.',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Hierarchy authorization evaluation error',
        error: error.message,
      });
    }
  };
};

module.exports = {
  getSubordinateIds,
  getAccessibleUserIds,
  canAccessUser,
  checkHierarchyAccess,
};
