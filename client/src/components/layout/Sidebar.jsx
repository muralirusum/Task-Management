import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  FolderKanban,
  BarChart3,
  FileText,
  History,
  ShieldCheck,
  Building2,
  UserCheck,
  User,
  Sparkles,
  ClipboardList,
  ClipboardCheck,
  Settings,
  CalendarDays,
  Briefcase,
  UserPlus,
  Building,
  LogOut,
  Bell,
  MessageSquare
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout, isMain, isMiddle, isLast } = useAuth();
  const location = useLocation();

  const getNavLinks = () => {
    if (isMain) {
      return [
        { label: 'CEO Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Approvals', path: '/approvals', icon: CheckCircle2 },
        { label: 'Employees & Org', path: '/team', icon: Building2 },
        { label: 'Communication', path: '/communication', icon: MessageSquare },
        { label: 'Daily Work Logs', path: '/daily-work', icon: FileText },
        { label: 'Time Tracking', path: '/time', icon: Clock },
        { label: 'Projects & Products', path: '/projects', icon: FolderKanban },
        { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { label: 'Audit / Activity Logs', path: '/activity-logs', icon: History },
        { label: 'Employee Logs', path: '/employee-logs', icon: ClipboardList },
      ];
    }

    if (isMiddle) {
      return [
        { label: 'Manager Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Approvals', path: '/approvals', icon: CheckCircle2 },
        { label: 'Employees & Org', path: '/team', icon: Building2 },
        { label: 'Communication', path: '/communication', icon: MessageSquare },
        { label: 'Daily Work Logs', path: '/daily-work', icon: FileText },
        { label: 'Time Tracking', path: '/time', icon: Clock },
        { label: 'Projects & Products', path: '/projects', icon: FolderKanban },
        { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { label: 'Audit / Activity Logs', path: '/activity-logs', icon: History },
        { label: 'Employee Logs', path: '/employee-logs', icon: ClipboardList },
      ];
    }

    // Last Person navigation
    return [
      { label: 'Employee Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
      { label: 'Communication', path: '/communication', icon: MessageSquare },
      { label: 'My Daily Work', path: '/daily-work', icon: FileText },
      { label: 'Time Tracking', path: '/time', icon: Clock },
      { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
      { label: 'My Submissions', path: '/tasks?filter=submitted', icon: CheckCircle2 },
      { label: 'My Reports', path: '/reports', icon: BarChart3 },
      { label: 'My Activity', path: '/activity-logs', icon: History },
      { label: 'Attendance', path: '/attendance', icon: CalendarDays },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-black tracking-tight flex items-baseline">
          <span style={{ color: '#1d4ed8' }} className="font-extrabold">cGxP</span>
          <span style={{ color: '#2563eb' }} className="font-bold ml-0.5 font-mono text-xl">.Tech</span>
        </h1>
      </div>

      {/* Role Pill Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            {isMain && <ShieldCheck className="w-4 h-4 text-blue-600" />}
            {isMiddle && <UserCheck className="w-4 h-4 text-blue-600" />}
            {isLast && <User className="w-4 h-4 text-blue-600" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {isMain && 'Level 1 • CEO (Executive)'}
              {isMiddle && `Level 2 • MANAGER (${user?.department})`}
              {isLast && `Level 3 • EMPLOY (${user?.position})`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation ({user?.role?.toUpperCase()})
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          
          // Custom logic for active state to handle query parameters correctly
          let isActive = false;
          if (item.path === '/') {
            isActive = location.pathname === '/';
          } else if (item.path.includes('?')) {
            isActive = location.pathname + location.search === item.path;
          } else if (item.path === '/tasks' && location.pathname === '/tasks') {
            isActive = !location.search.includes('filter=submitted');
          } else {
            isActive = location.pathname.startsWith(item.path);
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/70'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Company Tag */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
        <p className="text-[11px] font-semibold text-slate-800">cGxP Tech</p>
        <p className="text-[10px] text-slate-500">Workforce & Task Management SaaS</p>
      </div>
    </aside>
  );
};
