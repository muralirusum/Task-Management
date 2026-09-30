const maskTaskForUser = (taskDoc, viewerUser) => {
  if (!taskDoc) return null;
  const task = taskDoc.toObject ? taskDoc.toObject() : JSON.parse(JSON.stringify(taskDoc));

  // If CEO (Level 1), they see complete, unmasked data
  if (viewerUser.role === 'ceo' || viewerUser.role === 'main' || viewerUser.level === 1) {
    return task;
  }

  // If Manager (Level 2), filter out internal CEO private notes/comments
  if (viewerUser.role === 'manager' || viewerUser.role === 'middle' || viewerUser.level === 2) {
    if (task.comments) {
      task.comments = task.comments.filter((c) => {
        if (!c.isInternal) return true;
        return c.userId?.toString() === viewerUser._id.toString() || (c.userRole !== 'ceo' && c.userRole !== 'main');
      });
    }
    return task;
  }

  // If Employee (Level 3, e.g. Sandeep)
  if (viewerUser.role === 'employee' || viewerUser.role === 'last' || viewerUser.level >= 3) {
    // Crucial rule: If task is in review pipeline, employee only sees 'Submitted'
    if (
      task.status === 'Under Review' ||
      task.status === 'Forwarded to Main' ||
      (task.status === 'Approved' && task.approvalStage < 3)
    ) {
      task.displayStatus = 'Submitted';
    } else {
      task.displayStatus = task.status;
    }

    // Strip internal manager/director comments completely
    if (task.comments) {
      task.comments = task.comments.filter((c) => !c.isInternal);
    }

    // Hide internal approval stage counter or audit linkages
    delete task.approvalStage;
    delete task.forwardedTo;

    // Show only basic assignedBy info (name, position, department)
    if (task.assignedBy && typeof task.assignedBy === 'object') {
      task.assignedBy = {
        _id: task.assignedBy._id,
        name: task.assignedBy.name,
        position: task.assignedBy.position,
        department: task.assignedBy.department,
        avatar: task.assignedBy.avatar,
      };
    }

    return task;
  }

  return task;
};

const maskApprovalsForUser = (approvals, viewerUser) => {
  if (!approvals || !Array.isArray(approvals)) return [];

  if (viewerUser.role === 'ceo' || viewerUser.role === 'main' || viewerUser.level === 1) {
    return approvals;
  }

  if (viewerUser.role === 'manager' || viewerUser.role === 'middle' || viewerUser.level === 2) {
    return approvals.filter((app) => app.level === 1 || app.reviewerRole === 'manager' || app.reviewerRole === 'middle');
  }

  // Employee: Return empty list because all internal manager/CEO approval details are hidden
  return [];
};

/**
 * Filter audit/activity logs based on user role.
 * - Main Person: complete activity history.
 * - Middle Person: activities performed by or targeting themselves and their subordinates.
 * - Last Person: activities strictly performed by themselves or directly targeted to them (excluding internal manager actions).
 */
const maskActivitiesForUser = (activities, viewerUser, accessibleUserIds = []) => {
  if (!activities || !Array.isArray(activities)) return [];

  // CEO (Level 1) and Manager (Level 2) see complete activity logs for team and organization
  if (viewerUser.role === 'main' || viewerUser.role === 'ceo' || viewerUser.role === 'manager' || viewerUser.role === 'middle' || viewerUser.level <= 2) {
    return activities;
  }

  // Last person: Only their own actions and direct assignments, without internal manager approval steps
  return activities.filter((act) => {
    if (act.isInternalOnly) return false;
    const performerId = act.userId?.toString() || act.userId?._id?.toString();
    const targetId = act.targetUserId?.toString() || act.targetUserId?._id?.toString();
    return performerId === userIdStr || targetId === userIdStr;
  });
};

module.exports = {
  maskTaskForUser,
  maskApprovalsForUser,
  maskActivitiesForUser,
};
