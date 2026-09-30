import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Play,
  Pause,
  Square,
  Clock,
  LogOut,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileDropdownMenu } from '../profile/ProfileDropdownMenu';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { activeTimer, formattedTime, pauseTimer, resumeTimer, stopTimer } = useTimer();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Search / Page context */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <span className="text-slate-900 font-bold">{user?.department} Department</span>
          <span>/</span>
          <span className="text-blue-600 font-semibold">{user?.position}</span>
        </div>
      </div>

      {/* Right side widgets */}
      <div className="flex items-center gap-3">
        {/* Active Timer Pill */}
        {activeTimer && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-slate-900 shadow-sm animate-in fade-in">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeTimer.status === 'running' ? 'bg-blue-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTimer.status === 'running' ? 'bg-blue-600' : 'bg-amber-500'}`}></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-bold text-blue-700">{formattedTime}</span>
            <span className="max-w-[120px] truncate text-[11px] text-slate-600 hidden sm:inline font-medium">
              {activeTimer.taskId?.title}
            </span>

            <div className="flex items-center gap-1 pl-1 border-l border-blue-200">
              {activeTimer.status === 'running' ? (
                <button
                  onClick={pauseTimer}
                  title="Pause Timer"
                  className="p-1 rounded-md hover:bg-blue-100 text-amber-600 transition-colors"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume Timer"
                  className="p-1 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Stop Timer & Save Time"
                className="p-1 rounded-md hover:bg-rose-100 text-rose-600 transition-colors"
              >
                <Square className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}


        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-blue-600 relative transition-all shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 py-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => markAsRead(n._id)}
                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          n.read
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : 'bg-blue-50/60 border-blue-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile menu */}
        <ProfileDropdownMenu />
      </div>
    </header>
  );
};
