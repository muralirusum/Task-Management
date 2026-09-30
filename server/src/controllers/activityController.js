const ActivityLog = require('../models/ActivityLog');
const { getAccessibleUserIds } = require('../middlewares/hierarchy');
const { maskActivitiesForUser } = require('../middlewares/privacyMask');

// @desc    Get activity logs / audit history
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const { action, userId, search } = req.query;
    const accessibleIds = await getAccessibleUserIds(req.user);

    let query = {};
    if (action && action !== 'All') {
      query.action = action;
    }

    if (userId) {
      query.$or = [{ userId: userId }, { targetUserId: userId }];
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const activities = await ActivityLog.find(query)
      .populate('userId', 'name position department role avatar')
      .populate('targetUserId', 'name position department role avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    const maskedActivities = maskActivitiesForUser(activities, req.user, accessibleIds);

    res.json({
      success: true,
      count: maskedActivities.length,
      activities: maskedActivities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity history',
      error: error.message,
    });
  }
};

module.exports = {
  getActivities,
};
