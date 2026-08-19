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
  CalendarDays
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isMain, isMiddle, isLast } = useAuth();
  const location = useLocation();

  const getNavLinks = () => {
    if (isMain) {
      return [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Approvals', path: '/approvals', icon: CheckCircle2 },
        { label: 'Employees & Org', path: '/team', icon: Building2 },
        { label: 'Daily Work Logs', path: '/daily-work', icon: FileText },
        { label: 'Time Management', path: '/time', icon: Clock },
        { label: 'Projects & Products', path: '/projects', icon: FolderKanban },
        { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { label: 'Audit / Activity Logs', path: '/activity-logs', icon: History },
        { label: 'Employee Logs', path: '/employee-logs', icon: ClipboardList },
      ];
    }

    if (isMiddle) {
      return [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Approvals', path: '/approvals', icon: CheckCircle2 },
        { label: 'Employees & Org', path: '/team', icon: Building2 },
        { label: 'Daily Work Logs', path: '/daily-work', icon: FileText },
        { label: 'Time Management', path: '/time', icon: Clock },
        { label: 'Projects & Products', path: '/projects', icon: FolderKanban },
        { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { label: 'Audit / Activity Logs', path: '/activity-logs', icon: History },
        { label: 'Employee Logs', path: '/employee-logs', icon: ClipboardList },
      ];
    }

    // Last Person navigation
    return [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
      { label: 'My Daily Work', path: '/daily-work', icon: FileText },
      { label: 'Time Tracking', path: '/time', icon: Clock },
      { label: 'Attendance', path: '/attendance', icon: CalendarDays },
      { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
      { label: 'My Submissions', path: '/tasks?filter=submitted', icon: CheckCircle2 },
      { label: 'My Reports', path: '/reports', icon: BarChart3 },
      { label: 'My Activity', path: '/activity-logs', icon: History },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 bg-white">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20 text-white font-extrabold text-lg">
          C
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-900 tracking-wide leading-none flex items-center gap-1.5">
            cGxP Tech
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-mono px-1.5 py-0.5 rounded font-semibold">
              SaaS
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 tracking-tight mt-0.5 font-medium">Work & Time Suite</p>
        </div>
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
        <p className="text-[10px] text-slate-500">Hierarchical Management Suite</p>
      </div>
    </aside>
  );
};
