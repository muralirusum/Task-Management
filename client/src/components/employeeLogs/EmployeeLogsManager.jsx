import React, { useState, useEffect } from 'react';
import { 
  Users, Wifi, Activity, Clock, LogIn, LogOut, Coffee, Calendar, CheckCircle2, Filter, ChevronRight, XCircle, Send, Mail, CalendarDays, MapPin, RotateCcw, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { MapModal } from '../common/MapModal';
import { LiveLocationCard } from '../common/LiveLocationCard';
import { LeaveNotificationBanner } from '../common/LeaveNotificationBanner';

export const EmployeeLogsManager = () => {
  const { user } = useAuth();
  const { logs, leaves, markAttendance, requestLeave, updateLeaveStatus, getTodayLogs, getUserLogs, getUserLeaves } = useAttendance();

  const [managerLoggedIn, setManagerLoggedIn] = useState(false);
  const [managerLoggedOut, setManagerLoggedOut] = useState(false);
  const [managerLoginTime, setManagerLoginTime] = useState('--:-- --');
  const [managerLogoutTime, setManagerLogoutTime] = useState('--:-- --');
  const [managerLoginLocation, setManagerLoginLocation] = useState(null);
  const [managerLogoutLocation, setManagerLogoutLocation] = useState(null);
  const [loginTimestamp, setLoginTimestamp] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(null);

  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  const [users, setUsers] = useState([]);
  
  // Advanced filters state
  const [historyFilter, setHistoryFilter] = useState('Today');
  const [empFilter, setEmpFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);

  // Fetch users on mount for team filtering
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        if (res.data && res.data.success) {
           setUsers(res.data.data || res.data.users || res.data || []);
        } else if (Array.isArray(res.data)) {
           setUsers(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  const allUserLogs = getUserLogs(user?._id || user?.id) || [];
  const groupedLogs = allUserLogs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  const historyData = Object.keys(groupedLogs).map(date => {
    const dayLogs = groupedLogs[date].sort((a, b) => a.timestamp - b.timestamp);
    let totalSeconds = 0;
    let sessionStart = null;
    let firstLogin = null;
    let lastLogout = null;
    
    dayLogs.forEach(log => {
      if (log.action === 'login') {
        if (!firstLogin) firstLogin = log.timestamp;
        sessionStart = log.timestamp;
      } else if (log.action === 'logout' && sessionStart) {
        totalSeconds += Math.floor((log.timestamp - sessionStart) / 1000);
        lastLogout = log.timestamp;
        sessionStart = null;
      }
    });

    const parts = date.split('/');
    let dateObj;
    if (parts.length === 3) {
       dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
       dateObj = new Date(date);
    }

    return {
      date,
      dateObj,
      firstLogin,
      lastLogout,
      totalSeconds,
      status: totalSeconds > 0 ? (lastLogout ? 'Completed' : 'Incomplete') : 'No Session'
    };
  }).sort((a, b) => b.dateObj - a.dateObj);

  const filteredHistory = historyData.filter(item => {
    const now = new Date();
    if (historyFilter === 'Today') {
      return item.dateObj.toDateString() === now.toDateString();
    } else if (historyFilter === 'This Week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return item.dateObj >= weekAgo && item.dateObj <= now;
    } else if (historyFilter === 'This Month') {
      return item.dateObj.getMonth() === now.getMonth() && item.dateObj.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const formatHistoryDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Sync Manager's own attendance from context
  useEffect(() => {
    if (user && logs) {
      const todayLogs = getUserLogs(user._id || user.id).filter(log => log.date === new Date().toLocaleDateString('en-GB'));
      
      const ascendingLogs = [...todayLogs].sort((a, b) => a.timestamp - b.timestamp);
      
      let total = 0;
      let sessionStart = null;
      let firstLoginStr = '--:-- --';
      let lastLogoutStr = '--:-- --';
      let firstLoginLoc = null;
      let lastLogoutLoc = null;
      
      ascendingLogs.forEach(log => {
        if (log.action === 'login' || log.timestamp) {
          sessionStart = log.timestamp;
          firstLoginStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          firstLoginLoc = log.location || null;
          
          if (log.logoutTimestamp || log.status === 'completed') {
            const endTs = log.logoutTimestamp || log.timestamp;
            total = Math.max(0, Math.floor((endTs - log.timestamp) / 1000));
            lastLogoutStr = log.logoutTimestamp ? new Date(log.logoutTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : firstLoginStr;
            lastLogoutLoc = log.logoutLocation || log.location || null;
            sessionStart = null;
          }
        } else if (log.action === 'logout' && sessionStart) {
          total = Math.max(0, Math.floor((log.timestamp - sessionStart) / 1000));
          lastLogoutStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          lastLogoutLoc = log.location || null;
          sessionStart = null;
        }
      });
      
      setFinalDuration(total);

      if (sessionStart) {
        setManagerLoggedIn(true);
        setManagerLoggedOut(false);
        setLoginTimestamp(sessionStart);
        setManagerLoginTime(firstLoginStr);
        setManagerLogoutTime('--:-- --');
        setManagerLoginLocation(firstLoginLoc);
        setManagerLogoutLocation(null);
      } else {
        setManagerLoggedIn(false);
        if (ascendingLogs.length > 0) {
           setManagerLoggedOut(true);
           setManagerLoginTime(firstLoginStr);
           setManagerLogoutTime(lastLogoutStr);
           setManagerLoginLocation(firstLoginLoc);
           setManagerLogoutLocation(lastLogoutLoc);
        } else {
           setManagerLoggedOut(false);
           setManagerLoginTime('--:-- --');
           setManagerLogoutTime('--:-- --');
           setManagerLoginLocation(null);
           setManagerLogoutLocation(null);
        }
        setLoginTimestamp(null);
      }
    }
  }, [user, logs, getUserLogs]);

  const handleResetManagerSession = async () => {
    setManagerLoggedIn(false);
    setManagerLoggedOut(false);
    setManagerLoginTime('--:-- --');
    setManagerLogoutTime('--:-- --');
    setManagerLoginLocation(null);
    setManagerLogoutLocation(null);
    setLoginTimestamp(null);
    setElapsedSeconds(0);
    setFinalDuration(0);
    if (clearLogs) await clearLogs();
  };

  // Auto-updating timer
  useEffect(() => {
    let interval = null;
    if (managerLoggedIn && loginTimestamp) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - loginTimestamp) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(finalDuration || 0);
    }
    return () => clearInterval(interval);
  }, [managerLoggedIn, loginTimestamp, finalDuration]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '--';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m`;
  };

  // Calculate used leaves for indicators
  const userLeaves = getUserLeaves(user?._id || user?.id) || [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const usedLeavesCount = userLeaves.reduce((count, leave) => {
    if (leave.status === 'Approved') {
      const leaveDate = new Date(leave.fromDate);
      if (leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear) {
         return count + 1;
      }
    }
    return count;
  }, 0);

  const renderLeaveIndicators = () => {
    const totalLeaves = 3;
    const used = Math.min(usedLeavesCount, totalLeaves);
    return (
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500">Monthly Leaves (3)</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((num) => {
            const isUsed = num <= used;
            return (
              <div 
                key={num}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm transition-all duration-300 ${
                  isUsed 
                    ? 'bg-rose-500 text-white ring-2 ring-rose-100' 
                    : 'bg-white border-2 border-emerald-500 text-emerald-600'
                }`}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [liveLocationData, setLiveLocationData] = useState(null);

  const handleManagerLogin = async () => {
    if (liveLocationData && liveLocationData.distance > 200) {
      const proceed = window.confirm(
        `⚠️ Location Check Warning:\n\nYou are currently ${liveLocationData.distance} meters away from cGxPTech Guntur Autonagar.\nAllowed office radius is 200 meters.\n\nDo you want to confirm marking login for cGxPTech Guntur Autonagar?`
      );
      if (!proceed) return;
    }
    await markAttendance(user, 'login');
    setManagerLoggedIn(true);
    setManagerLoggedOut(false);
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setManagerLoginTime(nowStr);
    setLoginTimestamp(Date.now());
  };

  const handleManagerLogout = async () => {
    await markAttendance(user, 'logout');
    setManagerLoggedIn(false);
    setManagerLoggedOut(true);
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setManagerLogoutTime(nowStr);
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
  };

  // Compute Live Feed
  const liveFeed = [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).map(log => ({
    id: log.id,
    text: `${log.name} ${log.action === 'login' ? 'logged in' : 'logged out'}`,
    time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    type: log.action,
    location: log.location
  }));

  const formatLocationDisplay = (loc, defaultDept = 'cGxPTech HQ') => {
    if (!loc) {
      return {
        address: `cGxPTech.guntur, Autonagar, Guntur, AP, 522509, India`,
        latitude: 16.3185626,
        longitude: 80.4744787,
        shortText: `cGxPTech.guntur`
      };
    }
    if (typeof loc === 'string') {
      return {
        address: loc,
        latitude: 16.3185626,
        longitude: 80.4744787,
        shortText: loc.split(',')[0] || `cGxPTech.guntur`
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
        shortText: addr.split(',')[0] || `cGxPTech.guntur`
      };
    }
    return {
      address: `cGxPTech.guntur, Autonagar, Guntur, AP, 522509, India`,
      latitude: 16.3185626,
      longitude: 80.4744787,
      shortText: `cGxPTech.guntur`
    };
  };

  // Compute Employee Data for Table
  const todayLogs = getTodayLogs();
  const employeeMap = {};
  
  // Process logs chronologically to get accurate current status and total duration
  [...todayLogs].sort((a, b) => a.timestamp - b.timestamp).forEach(log => {
    if (!employeeMap[log.userId]) {
      employeeMap[log.userId] = {
        id: log.userId,
        name: log.name,
        role: log.role,
        department: log.department,
        managerId: log.managerId,
        loginTime: null,
        logoutTime: null,
        totalDurationMs: 0,
        login: '--:-- --',
        logout: '--:-- --',
        status: 'Offline',
        hours: '--',
        loginLocation: null,
        logoutLocation: null
      };
    }
    
    const emp = employeeMap[log.userId];
    const defaultLabel = log.department || 'Office';
    
    // New unified backend ensures there is only 1 login record per day. 
    // It might have logoutTimestamp included directly.
    if (log.action === 'login' || log.timestamp) {
      if (!emp.loginTime) {
         emp.loginTime = log.timestamp;
         emp.login = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
         emp.loginLocation = formatLocationDisplay(log.location);
      }
      
      if (log.logoutTimestamp || log.status === 'completed') {
         emp.logoutTime = log.logoutTimestamp;
         emp.logout = log.logoutTimestamp ? new Date(log.logoutTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : emp.logout;
         emp.logoutLocation = formatLocationDisplay(log.logoutLocation || log.location);
         emp.status = 'Completed';
      } else {
         emp.status = 'Active';
      }
    } else if (log.action === 'logout') {
      emp.logoutTime = log.timestamp;
      emp.logout = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      emp.status = 'Completed';
      emp.logoutLocation = formatLocationDisplay(log.location);
    }
  });

  const employeeData = Object.values(employeeMap)
    .filter(emp => {
      const isSelf = String(emp.id) === String(user?._id || user?.id);
      if (isSelf) return false;

      // Filter by Employee Name search
      if (empFilter && !emp.name?.toLowerCase().includes(empFilter.toLowerCase())) return false;
      
      // Filter by Department
      if (deptFilter && emp.department?.toLowerCase() !== deptFilter.toLowerCase()) return false;
      
      return true;
    })
    .map(emp => {
      let currentTotalMs = 0;
      if (emp.loginTime && emp.logoutTime) {
         currentTotalMs = emp.logoutTime - emp.loginTime;
      } else if (emp.loginTime && emp.status === 'Active') {
         currentTotalMs = Date.now() - emp.loginTime;
      }
      
      emp.hours = currentTotalMs > 0 ? formatDuration(Math.floor(currentTotalMs / 1000)) : '--';
      
      let statusIndicator = '⚫ Offline';
      let statusClass = 'text-slate-500 bg-slate-100 border border-slate-200 font-bold';
      
      if (emp.status === 'Active') {
        statusIndicator = '🟢 Active';
        statusClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold';
      } else if (emp.status === 'Completed' || emp.logoutTime) {
        statusIndicator = '🔵 Logged Out';
        statusClass = 'text-blue-700 bg-blue-50 border border-blue-200 font-bold';
      }
      
      // Apply status filter if set
      if (statusFilter && statusIndicator !== statusFilter && emp.status !== statusFilter) return null;

      emp.statusIndicator = statusIndicator;
      emp.statusClass = statusClass;

      return emp;
    })
    .filter(Boolean);

  // Team Leaves (Employees only, excluding self)
  const teamLeaves = leaves.filter(l => {
    const isSelf = String(l.userId) === String(user._id || user.id);
    const isManagerOrCEO = ['manager', 'middle', 'ceo', 'main'].includes(l.role?.toLowerCase());
    return !isSelf && !isManagerOrCEO;
  });

  const emergencyLeaves = teamLeaves.filter(l => l.leaveType === 'Emergency Leave' && l.status === 'Pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manager Attendance Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor your personal attendance and track real-time employee login/logout activity.
          </p>
        </div>
      </div>

      {/* Manager Attendance Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> My Attendance Panel
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Daily Login Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Daily Login Time</p>
              <p className="text-xl font-bold text-slate-900">{managerLoginTime}</p>
              {managerLoginLocation && (
                <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]" title={managerLoginLocation.address}>
                  📍 {managerLoginLocation.address.split(',')[0]}
                  {managerLoginLocation.latitude && (
                    <a href={`https://www.google.com/maps?q=${managerLoginLocation.latitude},${managerLoginLocation.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-1 hover:underline font-medium">
                      (Map)
                    </a>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={handleManagerLogin}
              disabled={managerLoggedIn}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                managerLoggedIn 
                  ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              <LogIn className="w-4 h-4" /> Mark Login
            </button>
          </div>

          {/* Daily Logout Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Daily Logout Time</p>
              <p className="text-xl font-bold text-slate-900">{managerLogoutTime}</p>
              {managerLogoutLocation && (
                <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]" title={managerLogoutLocation.address}>
                  📍 {managerLogoutLocation.address.split(',')[0]}
                  {managerLogoutLocation.latitude && (
                    <a href={`https://www.google.com/maps?q=${managerLogoutLocation.latitude},${managerLogoutLocation.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-1 hover:underline font-medium">
                      (Map)
                    </a>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={handleManagerLogout}
              disabled={!managerLoggedIn}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !managerLoggedIn 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
              }`}
            >
              <LogOut className="w-4 h-4" /> Mark Logout
            </button>
          </div>

          {/* Live Working Hours Card */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-semibold text-indigo-600 mb-1">Live Working Hours</p>
              <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {managerLoggedIn && !managerLoggedOut ? `${Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}` : '00:00:00'}
              </p>
            </div>
            <div className="relative z-10 mt-4">
               {managerLoggedIn ? (
                <div className="text-[10px] text-emerald-600 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Currently Tracking
                </div>
               ) : managerLoggedOut ? (
                <div className="text-[10px] text-indigo-600 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  ✔ Session Completed
                </div>
               ) : (
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  Awaiting Login
                </div>
               )}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Clock className="w-32 h-32 text-indigo-900" />
            </div>
          </div>

          {/* Manager Status Card & Live Location */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Current Status</p>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  managerLoggedIn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                  managerLoggedOut ? 'bg-slate-400' : 'bg-amber-400'
                }`}></span>
                <span className="text-xl font-bold text-slate-900">
                  {managerLoggedIn ? 'Online' : managerLoggedOut ? 'Offline' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

        </div>
        
        {/* Compact Live Location GPS Map Box */}
        <div className="pt-2 border-t border-slate-100">
          <LiveLocationCard compact={true} onLocationChange={(data) => setLiveLocationData(data)} />
        </div>
      </div>

      {/* Main Content Grid: Employee Table & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Employee Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Employee Login & Logout Activity</h3>
                <span className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-500">Live Updates</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md focus:ring-blue-500 focus:border-blue-500 p-1.5"
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md focus:ring-blue-500 focus:border-blue-500 p-1.5"
                >
                  <option value="">All Statuses</option>
                  <option value="🟢 Active">🟢 Active</option>
                  <option value="🟡 Away">🟡 Away</option>
                  <option value="🔵 In Meeting">🔵 In Meeting</option>
                  <option value="⚫ Offline">⚫ Offline</option>
                  <option value="🟠 On Leave">🟠 On Leave</option>
                </select>

                <input 
                  type="text" 
                  placeholder="Search employee..." 
                  value={empFilter}
                  onChange={e => setEmpFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-[10px] font-medium rounded-md focus:ring-blue-500 focus:border-blue-500 p-1.5 min-w-[120px]"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Login</th>
                    <th className="px-5 py-4">Logout</th>
                    <th className="px-5 py-4">Hours</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employeeData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-8 text-center text-slate-400">No activity recorded today.</td>
                    </tr>
                  ) : (
                    employeeData.map((emp, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              emp.status === 'Online' ? 'bg-emerald-500' :
                              emp.status === 'Offline' ? 'bg-slate-400' : 'bg-amber-500'
                            }`}></span>
                            <div>
                              <p className="font-bold text-slate-800">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.role?.toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-600">{emp.department || 'N/A'}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{emp.login}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{emp.logout}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {emp.hours}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[10px] min-w-[170px] truncate" title={emp.loginLocation?.address || 'cGxPTech.guntur'}>
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">cGxPTech.guntur</span>
                            <button
                              onClick={() => {
                                setMapFocus([emp.loginLocation?.latitude || 16.3185626, emp.loginLocation?.longitude || 80.4744787]);
                                setShowMap(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 ml-0.5 shrink-0"
                              title="View Map Location"
                            >
                              🗺️
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.statusClass}`}>
                            {emp.statusIndicator}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Live Employee Activity Feed</h3>
              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-[400px] relative">
              {liveFeed.length > 0 && <div className="absolute left-[29px] top-5 bottom-5 w-px bg-slate-100"></div>}
              <div className="space-y-6 relative z-10">
                {liveFeed.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-xs">No recent activity</div>
                ) : (
                  liveFeed.map((item, idx) => (
                    <div key={item.id} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm z-10 ${
                        item.type === 'login' ? 'bg-emerald-100 text-emerald-600' :
                        item.type === 'logout' ? 'bg-slate-100 text-slate-500' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {item.type === 'login' ? <LogIn className="w-3.5 h-3.5" /> : 
                         <LogOut className="w-3.5 h-3.5" />}
                      </div>
                      <div className="pt-1.5">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{item.text}</p>
                        {item.location && item.location.address && (
                          <p className="text-[10px] text-blue-600 mt-0.5 truncate max-w-[220px]" title={item.location.address}>
                            📍 {item.location.address.split(',')[0]}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Leave Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Team Leave Requests (For Manager to Approve) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Team Leave Requests</h3>
            <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">Needs Approval</span>
          </div>
          <div className="p-5 flex-1 overflow-auto max-h-[300px]">
            {teamLeaves.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-xs">No pending leave requests from team.</div>
            ) : (
              <div className="space-y-4">
                {teamLeaves.map(leave => (
                  <div key={leave.id} className="border border-slate-200 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{leave.name}</p>
                        <p className="text-xs text-slate-500">{leave.leaveType} ({leave.days} Days)</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                        leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{leave.fromDate} to {leave.toDate}</p>
                    <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">"{leave.reason}"</p>
                    {leave.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateLeaveStatus(leave._id, 'Approved', user.name)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition-colors">Approve</button>
                        <button onClick={() => updateLeaveStatus(leave._id, 'Rejected', user.name)} className="flex-1 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-bold transition-colors">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Manager's Own Leave Request (Goes to CEO) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> My Leave Request
            </h3>
            {renderLeaveIndicators()}
          </div>
          <form className="p-6 space-y-4" onSubmit={submitLeaveRequest}>
            {leaveSubmitted && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Request submitted to CEO successfully!
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Type</label>
                <select 
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                  <option value="">Select Type</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">From Date</label>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">To Date</label>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason for Leave</label>
              <textarea 
                rows="3" 
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 resize-none"
                placeholder="Brief reason for CEO..."
              ></textarea>
            </div>
            <div className="mt-2 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Request will be sent to:</p>
                  <p className="text-sm text-emerald-600">admin.ceo@cgxptech.com <span className="text-emerald-500 font-medium">(CEO)</span></p>
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="emailSentReminderManager"
                      required
                      className="w-4 h-4 text-emerald-600 bg-white border-emerald-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="emailSentReminderManager" className="text-xs font-semibold text-emerald-700 cursor-pointer">I have sent the email</label>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => window.location.href = `mailto:admin.ceo@cgxptech.com?subject=Leave Request from ${user?.name || 'Manager'}&body=I would like to request ${leaveType} from ${fromDate} to ${toDate}.%0D%0A%0D%0AReason: ${reason}`}
                className="bg-white border border-emerald-200 text-emerald-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors shrink-0 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" /> Send Email Now
              </button>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                <Send className="w-4 h-4" /> Submit Leave Request
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Attendance History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            Attendance History
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Date</th>
                <th className="pb-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">First Login</th>
                <th className="pb-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Last Logout</th>
                <th className="pb-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Total Hours</th>
                <th className="pb-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Location</th>
                <th className="pb-3 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((day, idx) => {
                  const isToday = day.date === new Date().toLocaleDateString('en-GB');
                  const displaySeconds = (isToday && managerLoggedIn && !managerLoggedOut) ? elapsedSeconds : day.totalSeconds;
                  const displayStatus = (isToday && managerLoggedIn && !managerLoggedOut) ? 'Currently Working' : day.status;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{day.dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400">{day.date}</div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {day.firstLogin ? new Date(day.firstLogin).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:-- --'}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {day.lastLogout ? new Date(day.lastLogout).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:-- --'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                          <Clock className="w-3 h-3" />
                          {formatHistoryDuration(displaySeconds)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs min-w-[170px] truncate" title="cGxPTech.guntur">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">cGxPTech.guntur</span>
                          <button
                            onClick={() => {
                              setSelectedLocation([16.3185626, 80.4744787]);
                              setShowMap(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 ml-1 shrink-0 p-0.5 rounded bg-blue-50 border border-blue-100"
                            title="View Map Location"
                          >
                            🗺️
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          displayStatus === 'Currently Working' ? 'bg-blue-100 text-blue-700' :
                          displayStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                          displayStatus === 'Incomplete' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarDays className="w-8 h-8 text-slate-200" />
                      No attendance records found for this period.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <MapModal 
        isOpen={showMap} 
        onClose={() => setShowMap(false)} 
        title="Team Location & Activity Map"
        center={mapFocus}
        locations={[
          // Include manager's own locations
          ...(managerLoginLocation ? [{ ...managerLoginLocation, name: user.name + ' (You)', role: 'Manager', status: 'Online', time: managerLoginTime }] : []),
          ...(managerLogoutLocation ? [{ ...managerLogoutLocation, name: user.name + ' (You)', role: 'Manager', status: 'Offline', time: managerLogoutTime }] : []),
          // Include employee locations
          ...employeeData.flatMap(emp => [
            emp.loginLocation ? { ...emp.loginLocation, name: emp.name, role: emp.role, status: 'Online', time: emp.login } : null,
            emp.logoutLocation && emp.status === 'Offline' ? { ...emp.logoutLocation, name: emp.name, role: emp.role, status: 'Offline', time: emp.logout } : null
          ]).filter(Boolean)
        ]} 
      />
    </div>
  );
};
