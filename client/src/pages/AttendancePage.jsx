import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  LogOut, 
  CheckCircle2, 
  Send,
  LogIn,
  History,
  Search,
  Filter,
  Users,
  MapPin,
  ShieldCheck,
  UserCheck,
  User,
  Building2,
  FileText,
  Calendar,
  Mail,
  RotateCcw,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { MapModal } from '../components/common/MapModal';
import { LiveLocationCard } from '../components/common/LiveLocationCard';

import { LeaveNotificationBanner } from '../components/common/LeaveNotificationBanner';

export const AttendancePage = () => {
  const { user, isMain, isMiddle } = useAuth();
  const { logs, markAttendance, clearLogs, requestLeave, getUserLogs, getUserLeaves } = useAttendance();

  const [loggedIn, setLoggedIn] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [loginTime, setLoginTime] = useState('--:-- --');
  const [logoutTime, setLogoutTime] = useState('--:-- --');
  const [loginTimestamp, setLoginTimestamp] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(null);
  const [liveLocationData, setLiveLocationData] = useState(null);
  
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [emailSentChecked, setEmailSentChecked] = useState(false);

  // History Tab, Date Range & Filters State
  const [historyTab, setHistoryTab] = useState(isMain || isMiddle ? 'team' : 'my'); // 'my' | 'team'
  const [dateRange, setDateRange] = useState('This Month'); // 'Today' | 'This Week' | 'This Month' | 'All Time'
  const [roleFilter, setRoleFilter] = useState('All'); // 'All' | 'Manager' | 'Employee'
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Map Modal State
  const [showMap, setShowMap] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);

  const currentDate = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Calculate monthly used leaves for indicators
  const userLeaves = user ? getUserLeaves(user._id || user.id) || [] : [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const usedLeavesCount = userLeaves.reduce((count, leave) => {
    if (leave.status === 'Approved' || leave.status === 'Pending') {
      const leaveDate = new Date(leave.fromDate);
      if (leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear) {
        return count + 1;
      }
    }
    return count;
  }, 0);

  const managerEmail = user?.role === 'manager' || user?.role === 'middle'
    ? 'ceo@novatech.com'
    : `${user?.department ? user.department.toLowerCase().replace(/\s+/g, '') : 'manager'}.it@cgxptech.com`;

  const handleResetToStartingPosition = async () => {
    setLoggedIn(false);
    setLoggedOut(false);
    setLoginTime('--:-- --');
    setLogoutTime('--:-- --');
    setLoginTimestamp(null);
    setElapsedSeconds(0);
    setFinalDuration(null);
    if (clearLogs) await clearLogs();
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear attendance history logs? This will reset check-in history.")) {
      if (clearLogs) await clearLogs();
      handleResetToStartingPosition();
    }
  };

  useEffect(() => {
    let interval = null;
    if (loggedIn && !loggedOut && loginTimestamp) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - loginTimestamp) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loggedIn, loggedOut, loginTimestamp]);

  // Auto-sync employee check-in state from logs
  useEffect(() => {
    if (!user) return;
    const userLogs = getUserLogs(user._id || user.id) || [];
    const todayStr = new Date().toLocaleDateString('en-GB');
    const todayLogs = userLogs.filter(log => log.date === todayStr);

    if (todayLogs.length > 0) {
      const ascendingLogs = [...todayLogs].sort((a, b) => a.timestamp - b.timestamp);
      
      let sessionStart = null;
      let firstLoginStr = '--:-- --';
      let lastLogoutStr = '--:-- --';
      let total = 0;

      ascendingLogs.forEach(log => {
        if (log.action === 'login' || log.timestamp) {
          if (!sessionStart) sessionStart = log.timestamp;
          if (firstLoginStr === '--:-- --') {
            firstLoginStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          }
        }
        if (log.logoutTimestamp || log.action === 'logout') {
          const logoutTime = log.logoutTimestamp || log.timestamp;
          if (sessionStart) {
            total += Math.max(0, Math.floor((logoutTime - sessionStart) / 1000));
          }
          lastLogoutStr = new Date(logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          sessionStart = null;
        }
      });

      setFinalDuration(total);

      if (sessionStart) {
        setLoggedIn(true);
        setLoggedOut(false);
        setLoginTimestamp(sessionStart);
        setLoginTime(firstLoginStr);
        setLogoutTime('--:-- --');
      } else {
        setLoggedIn(false);
        if (ascendingLogs.some(l => l.logoutTimestamp || l.action === 'logout')) {
          setLoggedOut(true);
          setLoginTime(firstLoginStr);
          setLogoutTime(lastLogoutStr);
          setElapsedSeconds(total);
        } else {
          setLoggedOut(false);
          setLoginTime('--:-- --');
          setLogoutTime('--:-- --');
          setElapsedSeconds(0);
        }
        setLoginTimestamp(null);
      }
    } else {
      setLoggedIn(false);
      setLoggedOut(false);
      setLoginTime('--:-- --');
      setLogoutTime('--:-- --');
      setLoginTimestamp(null);
      setElapsedSeconds(0);
      setFinalDuration(0);
    }
  }, [user, logs]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return '00h 00m 00s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleLogin = async () => {
    // Check location distance to cGxPTech Guntur Autonagar (200m allowed office radius)
    if (liveLocationData && liveLocationData.distance > 200) {
      const proceed = window.confirm(
        `⚠️ Location Check Warning:\n\nYou are currently ${liveLocationData.distance} meters away from cGxPTech Guntur Autonagar.\nAllowed office radius is 200 meters.\n\nDo you want to confirm marking login for cGxPTech Guntur Autonagar?`
      );
      if (!proceed) return;
    }

    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setLoggedIn(true);
    setLoggedOut(false);
    setLoginTime(nowStr);
    setLoginTimestamp(Date.now());
    setElapsedSeconds(0);
    markAttendance(user, 'login');
  };

  const handleLogout = async () => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setLoggedOut(true);
    setLoggedIn(false);
    setLogoutTime(nowStr);
    if (loginTimestamp) {
      setFinalDuration(Math.floor((Date.now() - loginTimestamp) / 1000));
    }
    await markAttendance(user, 'logout');
  };

  const submitLeaveRequest = (e) => {
    e.preventDefault();
    if (!leaveType || !fromDate || !toDate) return;
    
    const fDate = new Date(fromDate);
    const tDate = new Date(toDate);
    const diffTime = Math.abs(tDate - fDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    requestLeave(user, { leaveType, fromDate, toDate, reason, days: diffDays });
    setLeaveSubmitted(true);
    setTimeout(() => setLeaveSubmitted(false), 3000);
    setLeaveType('');
    setFromDate('');
    setToDate('');
    setReason('');
    setEmailSentChecked(false);
  };

  const handleSendEmailNow = () => {
    const subject = encodeURIComponent(`Leave Request: ${user?.name || 'Employee'} (${leaveType || 'Leave'})`);
    const body = encodeURIComponent(
      `Dear Manager,\n\nI am requesting ${leaveType || 'leave'} from ${fromDate || 'N/A'} to ${toDate || 'N/A'}.\n\nReason:\n${reason || 'N/A'}\n\nBest regards,\n${user?.name || ''}`
    );
    window.open(`mailto:${managerEmail}?subject=${subject}&body=${body}`, '_blank');
    setEmailSentChecked(true);
  };

  // Helper to format location object or string
  const formatLocationDisplay = (loc, defaultLabel = 'cGxPTech.guntur') => {
    if (!loc) {
      return {
        address: `cGxPTech.guntur, Autonagar, Guntur, AP, 522509, India`,
        latitude: 16.3185626,
        longitude: 80.4744787,
        shortText: defaultLabel
      };
    }
    if (typeof loc === 'string') {
      return {
        address: loc,
        latitude: 16.3185626,
        longitude: 80.4744787,
        shortText: loc.split(',')[0] || defaultLabel
      };
    }
    if (typeof loc === 'object') {
      const lat = loc.latitude || loc.lat || 16.3185626;
      const lng = loc.longitude || loc.lng || 80.4744787;
      const addr = loc.address || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      return {
        address: addr,
        latitude: lat,
        longitude: lng,
        shortText: addr.split(',')[0] || defaultLabel
      };
    }
    return {
      address: `cGxPTech.guntur, Autonagar, Guntur, AP, 522509, India`,
      latitude: 16.3185626,
      longitude: 80.4744787,
      shortText: defaultLabel
    };
  };

  // Helper to open map modal
  const openLocationMap = (loc, userName) => {
    const formatted = formatLocationDisplay(loc);
    setMapFocus({
      lat: formatted.latitude,
      lng: formatted.longitude,
      title: `${userName}'s Location`,
      address: formatted.address
    });
    setShowMap(true);
  };

  // Process logs into structured daily rows for History Table
  const processAttendanceHistory = () => {
    const isEmployeeOnly = !isMain && !isMiddle;
    const isMyTab = historyTab === 'my' || isEmployeeOnly;

    const rawLogs = isMyTab
      ? logs.filter(l => String(l.userId) === String(user?._id || user?.id))
      : logs;

    const groupedMap = {};

    [...rawLogs].sort((a, b) => a.timestamp - b.timestamp).forEach(log => {
      const key = `${log.date}_${log.userId}`;
      if (!groupedMap[key]) {
        groupedMap[key] = {
          key,
          userId: log.userId,
          name: log.name || 'User',
          role: log.role || 'employee',
          department: log.department || 'Operations',
          date: log.date,
          timestamp: log.timestamp,
          loginTime: null,
          logoutTime: null,
          logoutTimestamp: null,
          loginLocation: null,
          logoutLocation: null,
          status: 'Offline',
          durationMs: 0
        };
      }

      const entry = groupedMap[key];
      const defaultDept = log.department || 'Office';

      if (log.action === 'login' || log.timestamp) {
        if (!entry.loginTime) {
          entry.loginTime = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          entry.timestamp = log.timestamp;
          entry.loginLocation = formatLocationDisplay(log.location, `${defaultDept} HQ`);
        }

        const isLogToday = log.date === new Date().toLocaleDateString('en-GB');

        if (log.logoutTimestamp || log.status === 'completed') {
          entry.logoutTimestamp = log.logoutTimestamp;
          entry.logoutTime = log.logoutTimestamp ? new Date(log.logoutTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:-- --';
          entry.logoutLocation = formatLocationDisplay(log.logoutLocation || log.location, `${defaultDept} HQ`);
          entry.status = 'Completed';
          entry.durationMs = (log.logoutTimestamp && log.timestamp) ? Math.max(0, log.logoutTimestamp - log.timestamp) : 0;
        } else if (isLogToday) {
          entry.status = 'Active';
          entry.durationMs = entry.timestamp ? Math.max(0, Date.now() - entry.timestamp) : 0;
        } else {
          entry.status = 'Incomplete';
          entry.durationMs = 0;
        }
      } else if (log.action === 'logout') {
        entry.logoutTimestamp = log.timestamp;
        entry.logoutTime = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        entry.logoutLocation = formatLocationDisplay(log.location, `${defaultDept} HQ`);
        entry.status = 'Completed';
        if (entry.timestamp) {
          entry.durationMs = Math.max(0, log.timestamp - entry.timestamp);
        }
      }
    });

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-GB');

    return Object.values(groupedMap)
      .filter(item => {
        // Date Range filter (Today, This Week, This Month, All Time)
        if (dateRange === 'Today') {
          if (item.date !== todayStr) return false;
        } else if (dateRange === 'This Week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (item.timestamp && item.timestamp < weekAgo.getTime()) return false;
        } else if (dateRange === 'This Month') {
          if (item.timestamp) {
            const d = new Date(item.timestamp);
            if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
          }
        }

        // Manager / Admin specific filters
        if (!isMyTab) {
          // Role filter
          if (roleFilter === 'Manager' && !['manager', 'middle'].includes(item.role?.toLowerCase())) return false;
          if (roleFilter === 'Employee' && !['employee', 'last'].includes(item.role?.toLowerCase())) return false;

          // Department filter
          if (deptFilter !== 'All' && item.department?.toLowerCase() !== deptFilter.toLowerCase()) return false;

          // Status filter
          if (statusFilter !== 'All' && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;

          // Search query
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = item.name.toLowerCase().includes(q);
            const matchDate = item.date.toLowerCase().includes(q);
            const matchDept = item.department.toLowerCase().includes(q);
            const matchRole = item.role.toLowerCase().includes(q);
            if (!matchName && !matchDate && !matchDept && !matchRole) return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  const historyRows = processAttendanceHistory();
  const isEmployeeOnly = !isMain && !isMiddle;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Center</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Daily check-ins, leave applications, and attendance history logs.
            </p>
          </div>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Daily Login Time */}
        <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Daily Login Time</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{loggedIn ? loginTime : '--:-- --'}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-blue-600" /> {currentDate}
            </p>
          </div>
        </div>

        {/* Daily Logout Time */}
        <div className="bg-emerald-50/70 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Daily Logout Time</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{loggedOut ? logoutTime : '--:-- --'}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-emerald-600" /> {currentDate}
            </p>
          </div>
        </div>

        {/* Total Working Hours */}
        <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Total Working Hours</p>
            {loggedIn && !loggedOut ? (
              <>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{formatDuration(elapsedSeconds)}</p>
                <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Currently Working
                </div>
              </>
            ) : loggedOut ? (
              <>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{formatDuration(finalDuration || elapsedSeconds)}</p>
                <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 font-bold">
                  ✔ Work Session Completed
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-extrabold text-slate-900 mt-1">00h 00m 00s</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Today</p>
              </>
            )}
          </div>
        </div>

        {/* Attendance Status */}
        <div className="bg-teal-50/70 border border-teal-100 p-5 rounded-2xl flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Attendance Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 ${loggedIn ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {loggedIn ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {loggedIn ? 'Present' : 'Not Logged In'}
              </span>
            </div>
            {loggedIn && !loggedOut && <p className="text-[10px] text-teal-700 font-bold mt-1">On Time</p>}
          </div>
        </div>

      </div>

      {/* Middle Grid Layout: Actions & Leave Request */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Login & Logout Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 text-blue-600 font-extrabold text-base">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <LogIn className="w-5 h-5" />
              </div>
              Daily Login & Logout Action
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600">Login Time</p>
                    <p className="text-base font-extrabold text-slate-900">{loggedIn ? loginTime : '--:-- --'}</p>
                  </div>
                </div>
                <div className={`text-xs font-bold py-1.5 rounded-xl flex items-center justify-center gap-1 ${loggedIn ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200/80 text-slate-500'}`}>
                  {loggedIn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>} 
                  {loggedIn ? 'Logged In' : 'Not Logged In'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600">Logout Time</p>
                    <p className="text-base font-extrabold text-slate-900">{loggedOut ? logoutTime : '--:-- --'}</p>
                  </div>
                </div>
                <div className={`text-xs font-bold py-1.5 rounded-xl flex items-center justify-center gap-1 ${loggedOut ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200/80 text-slate-500'}`}>
                  {loggedOut ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>}
                  {loggedOut ? 'Logged Out' : 'Not Logged Out'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button 
              onClick={handleLogin}
              disabled={loggedIn}
              className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${loggedIn ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-[0.98]'}`}
            >
              <LogIn className="w-4 h-4" /> Mark Login
            </button>
            <button 
              onClick={handleLogout}
              disabled={!loggedIn || loggedOut}
              className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${!loggedIn || loggedOut ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/30 active:scale-[0.98]'}`}
            >
              <LogOut className="w-4 h-4" /> Mark Logout
            </button>
          </div>

          {/* Compact Live Location GPS Map Box embedded inside left action card */}
          <div className="pt-3 border-t border-slate-100">
            <LiveLocationCard compact={true} onLocationChange={(data) => setLiveLocationData(data)} />
          </div>
        </div>

        {/* Leave Request Panel - Matching User Screenshot Exact Design */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-indigo-950 tracking-tight">Leave Request</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Monthly Leaves (3)</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((num) => {
                    const isUsed = num <= usedLeavesCount;
                    return (
                      <div
                        key={num}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isUsed
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-white border-2 border-emerald-500 text-emerald-600 shadow-2xs'
                        }`}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={submitLeaveRequest}>
            {leaveSubmitted && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Leave request submitted successfully!
              </div>
            )}

            {/* Leave Type Dropdown with Emergency Leave */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 sm:w-24 shrink-0">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-medium"
              >
                <option value="">Select Leave Type</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
              </select>
            </div>

            {/* From Date & To Date */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 sm:w-24 shrink-0">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium"
              />

              <label className="text-xs font-bold text-slate-700 shrink-0 sm:ml-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium"
              />
            </div>

            {/* Reason */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <label className="text-xs font-bold text-slate-700 sm:w-24 shrink-0 pt-2">Reason</label>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="flex-1 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 resize-none font-medium"
                placeholder="Enter reason for leave"
              ></textarea>
            </div>

            {/* Green Notice Box: Request will be sent to */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">Request will be sent to:</span>
                    <span className="text-xs font-semibold text-emerald-700 font-mono">
                      {managerEmail} (Manager)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendEmailNow}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
                >
                  <Mail className="w-3.5 h-3.5" /> Send Email Now
                </button>
              </div>

              <div className="pt-2 border-t border-emerald-200/60">
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSentChecked}
                    onChange={(e) => setEmailSentChecked(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-emerald-300"
                  />
                  <span>I have sent the email</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-blue-600 text-white font-bold py-3 px-6 text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30"
              >
                <Send className="w-4 h-4" /> Submit Leave Request
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ATTENDANCE HISTORY SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Section Header & Period Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Attendance History Logs</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isEmployeeOnly 
                  ? "Detailed record of your check-in times, logout times, locations, and working duration."
                  : "Detailed record of daily check-in times, logout times, locations, and working duration."
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Calendar Range Period Pills */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/60">
              {['Today', 'This Week', 'This Month', 'All Time'].map((period) => (
                <button
                  key={period}
                  onClick={() => setDateRange(period)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dateRange === period
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Manager / Admin Team vs My Tabs */}
            {(isMain || isMiddle) && (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/60">
                <button
                  onClick={() => setHistoryTab('team')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    historyTab === 'team'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Team
                </button>
                <button
                  onClick={() => setHistoryTab('my')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    historyTab === 'my'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  My Logs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manager / Admin Advanced Filters Toolbar (Hidden for Employee) */}
        {!isEmployeeOnly && historyTab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, date, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="All">All Roles</option>
                <option value="Manager">Managers</option>
                <option value="Employee">Employees</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="lg:col-span-3">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="All">All Departments</option>
                <option value="Executive Management">Executive Management</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Operations & HR">Operations & HR</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="All">All Attendance Statuses</option>
                <option value="Active">Active / Online</option>
                <option value="Completed">Completed</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>
        )}

        {/* Attendance History Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                {!isEmployeeOnly && historyTab === 'team' && <th className="py-3 px-4">Employee / Manager</th>}
                {!isEmployeeOnly && historyTab === 'team' && <th className="py-3 px-4">Department</th>}
                <th className="py-3 px-4">Login Time</th>
                <th className="py-3 px-4">Logout Time</th>
                <th className="py-3 px-4">Work Duration</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-medium text-slate-800">
              {historyRows.length > 0 ? (
                historyRows.map((row) => {
                  const isManagerRole = ['manager', 'middle'].includes(row.role?.toLowerCase());
                  const isCeoRole = ['ceo', 'main'].includes(row.role?.toLowerCase());

                  const isTodayRow = row.date === new Date().toLocaleDateString('en-GB');
                  const isCurrentUserRow = String(row.userId) === String(user?._id || user?.id);

                  const displaySeconds = (isTodayRow && isCurrentUserRow)
                    ? (loggedIn && !loggedOut ? elapsedSeconds : (loggedOut ? Math.floor(row.durationMs / 1000) : 0))
                    : Math.floor(row.durationMs / 1000);

                  const displayStatus = (isTodayRow && isCurrentUserRow)
                    ? (loggedIn && !loggedOut ? 'Active' : (loggedOut ? 'Completed' : 'Not Logged In'))
                    : (row.status === 'Active' && !isTodayRow ? 'Incomplete' : row.status);

                  return (
                    <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                          <span>{row.date}</span>
                        </div>
                      </td>

                      {/* User Info & Role Pill (for Team View) */}
                      {!isEmployeeOnly && historyTab === 'team' && (
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                              {row.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{row.name}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  isCeoRole ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  isManagerRole ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {isCeoRole ? 'CEO' : isManagerRole ? 'MANAGER' : 'EMPLOYEE'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{row.department}</p>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Department (for Team View) */}
                      {!isEmployeeOnly && historyTab === 'team' && (
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {row.department}
                          </div>
                        </td>
                      )}

                      {/* Login Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.loginTime ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{row.loginTime}</span>
                            {row.loginLocation && (
                              <button
                                onClick={() => openLocationMap(row.loginLocation, row.name)}
                                title="View Login Location on Map"
                                className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                              >
                                <MapPin className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">--:-- --</span>
                        )}
                      </td>

                      {/* Logout Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.logoutTime ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{row.logoutTime}</span>
                            {row.logoutLocation && (
                              <button
                                onClick={() => openLocationMap(row.logoutLocation, row.name)}
                                title="View Logout Location on Map"
                                className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                              >
                                <MapPin className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">--:-- --</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatDuration(displaySeconds)}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[170px] font-bold text-slate-900">cGxPTech.guntur</span>
                          <button
                            type="button"
                            onClick={() => openLocationMap(row.loginLocation, row.name)}
                            title="View Map Location"
                            className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors shrink-0"
                          >
                            🗺️
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full inline-flex items-center gap-1 border ${
                          displayStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : displayStatus === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            displayStatus === 'Active' ? 'bg-emerald-500 animate-pulse' :
                            displayStatus === 'Completed' ? 'bg-blue-500' : 'bg-slate-400'
                          }`} />
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={!isEmployeeOnly && historyTab === 'team' ? 8 : 6} className="py-10 text-center text-slate-400 text-xs font-medium">
                    No attendance history logs found for {dateRange.toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Interactive Location Map Modal */}
      {showMap && mapFocus && (
        <MapModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          latitude={mapFocus.lat}
          longitude={mapFocus.lng}
          title={mapFocus.title}
          address={mapFocus.address}
        />
      )}

    </div>
  );
};

export default AttendancePage;
