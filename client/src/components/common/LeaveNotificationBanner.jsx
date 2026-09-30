import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { XCircle, CheckCircle2, X } from 'lucide-react';

export const LeaveNotificationBanner = () => {
  const { user } = useAuth();
  const { getUserLeaves, leaves } = useAttendance();
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissedLeaveNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  if (!user) return null;

  // Get current user's leaves
  const userLeaves = user ? getUserLeaves(user._id || user.id) : [];

  // Filter leaves with status 'Approved' or 'Rejected' that are not dismissed yet
  const activeNotifications = userLeaves.filter(
    (leave) =>
      (leave.status === 'Approved' || leave.status === 'Rejected') &&
      !dismissedIds.includes(String(leave._id || leave.id))
  );

  if (activeNotifications.length === 0) return null;

  const handleDismiss = (leaveId) => {
    const nextDismissed = [...dismissedIds, String(leaveId)];
    setDismissedIds(nextDismissed);
    try {
      localStorage.setItem('dismissedLeaveNotifications', JSON.stringify(nextDismissed));
    } catch (err) {
      console.error('Failed to save dismissed notification', err);
    }
  };

  return (
    <div className="space-y-3 mb-4 animate-in slide-in-from-top-2 duration-300">
      {activeNotifications.map((leave) => {
        const isRejected = leave.status === 'Rejected';
        const leaveId = leave._id || leave.id;

        const fromStr = leave.fromDate
          ? new Date(leave.fromDate).toLocaleDateString('en-US')
          : '';
        const toStr = leave.toDate
          ? new Date(leave.toDate).toLocaleDateString('en-US')
          : '';

        const dateRange = fromStr && toStr ? `(${fromStr} to ${toStr})` : '';

        const rawType = leave.leaveType || 'Personal';
        const cleanType = rawType.toLowerCase().includes('leave') ? rawType : `${rawType} Leave`;

        return (
          <div
            key={leaveId}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm transition-all ${
              isRejected
                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  isRejected
                    ? 'bg-rose-100/80 border-rose-200 text-rose-600'
                    : 'bg-emerald-100/80 border-emerald-200 text-emerald-600'
                }`}
              >
                {isRejected ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold tracking-tight leading-tight">
                  Your {cleanType} has been {leave.status}!
                </h4>
                <p
                  className={`text-xs font-semibold mt-0.5 truncate ${
                    isRejected ? 'text-rose-700/90' : 'text-emerald-700/90'
                  }`}
                >
                  {rawType} {dateRange}
                  {leave.reason ? ` • ${leave.reason}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDismiss(leaveId)}
              className={`p-1.5 rounded-full hover:bg-black/5 transition-colors shrink-0 ${
                isRejected ? 'text-rose-500 hover:text-rose-700' : 'text-emerald-500 hover:text-emerald-700'
              }`}
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default LeaveNotificationBanner;
