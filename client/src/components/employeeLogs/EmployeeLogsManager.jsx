import React, { useState, useEffect } from 'react';
import { 
  Users, Wifi, Activity, Clock, LogIn, LogOut, Coffee, Calendar, CheckCircle2, Filter, ChevronRight, XCircle, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

export const EmployeeLogsManager = () => {
  const { user } = useAuth();
  const { logs, leaves, markAttendance, requestLeave, updateLeaveStatus, getTodayLogs, getUserLogs, getUserLeaves } = useAttendance();

  const [managerLoggedIn, setManagerLoggedIn] = useState(false);
  const [managerLoggedOut, setManagerLoggedOut] = useState(false);
  const [managerLoginTime, setManagerLoginTime] = useState('--:-- --');
  const [managerLogoutTime, setManagerLogoutTime] = useState('--:-- --');
  const [loginTimestamp, setLoginTimestamp] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(null);

  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Sync Manager's own attendance from context
  useEffect(() => {
    if (user) {
      const todayLogs = getUserLogs(user._id || user.id).filter(log => log.date === new Date().toLocaleDateString('en-GB'));
      const loginLog = todayLogs.find(l => l.action === 'login');
      const logoutLog = todayLogs.find(l => l.action === 'logout');
      
      if (loginLog) {
        setManagerLoggedIn(true);
        setManagerLoginTime(new Date(loginLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setLoginTimestamp(loginLog.timestamp);
      }
      
      if (logoutLog) {
        setManagerLoggedOut(true);
        setManagerLogoutTime(new Date(logoutLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (loginLog) {
          setFinalDuration(Math.floor((logoutLog.timestamp - loginLog.timestamp) / 1000));
        }
      }
    }
  }, [user, logs]);

  // Auto-updating timer
  useEffect(() => {
    let interval = null;
    if (managerLoggedIn && !managerLoggedOut && loginTimestamp) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - loginTimestamp) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [managerLoggedIn, managerLoggedOut, loginTimestamp]);

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '--';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m`;
  };

  const handleManagerLogin = () => {
    markAttendance(user, 'login');
  };

  const handleManagerLogout = () => {
    markAttendance(user, 'logout');
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
    type: log.action
  }));

  // Compute Employee Data for Table
  const todayLogs = getTodayLogs();
  const employeeMap = {};
  
  todayLogs.forEach(log => {
    if (!employeeMap[log.userId]) {
      employeeMap[log.userId] = {
        id: log.userId,
        name: log.name,
        role: log.role,
        department: log.department,
        loginTimestamp: null,
        logoutTimestamp: null,
        login: '--',
        logout: '--',
        status: 'Offline',
        hours: '--'
      };
    }
    
    if (log.action === 'login') {
      employeeMap[log.userId].loginTimestamp = log.timestamp;
      employeeMap[log.userId].login = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      employeeMap[log.userId].status = 'Online';
    } else if (log.action === 'logout') {
      employeeMap[log.userId].logoutTimestamp = log.timestamp;
      employeeMap[log.userId].logout = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      employeeMap[log.userId].status = 'Offline';
    }
  });

  const employeeData = Object.values(employeeMap).map(emp => {
    if (emp.loginTimestamp && emp.logoutTimestamp) {
      emp.hours = formatDuration(Math.floor((emp.logoutTimestamp - emp.loginTimestamp) / 1000));
    } else if (emp.loginTimestamp) {
      emp.hours = formatDuration(Math.floor((Date.now() - emp.loginTimestamp) / 1000));
    }
    return emp;
  });

  // Team Leaves (Employees)
  const teamLeaves = leaves.filter(l => l.role !== 'MANAGER' && l.role !== 'CEO');

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
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" /> My Attendance Panel
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Daily Login Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Daily Login Time</p>
              <p className="text-xl font-bold text-slate-900">{managerLoginTime}</p>
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
              <LogIn className="w-4 h-4" /> {managerLoggedIn ? 'Logged In' : 'Mark Login'}
            </button>
          </div>

          {/* Daily Logout Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Daily Logout Time</p>
              <p className="text-xl font-bold text-slate-900">{managerLogoutTime}</p>
            </div>
            <button 
              onClick={handleManagerLogout}
              disabled={!managerLoggedIn || managerLoggedOut}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !managerLoggedIn || managerLoggedOut 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
              }`}
            >
              <LogOut className="w-4 h-4" /> {managerLoggedOut ? 'Logged Out' : 'Mark Logout'}
            </button>
          </div>

          {/* Live Working Hours Card */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-semibold text-indigo-600 mb-1">Live Working Hours</p>
              <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {managerLoggedIn && !managerLoggedOut ? `${Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}` : managerLoggedOut ? `${Math.floor((finalDuration || elapsedSeconds) / 3600).toString().padStart(2, '0')}:${Math.floor(((finalDuration || elapsedSeconds) % 3600) / 60).toString().padStart(2, '0')}:${((finalDuration || elapsedSeconds) % 60).toString().padStart(2, '0')}` : '00:00:00'}
              </p>
            </div>
            <div className="relative z-10 mt-4">
               {managerLoggedIn && !managerLoggedOut ? (
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

          {/* Manager Status Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Current Status</p>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  managerLoggedIn && !managerLoggedOut ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                  managerLoggedOut ? 'bg-slate-400' : 'bg-amber-400'
                }`}></span>
                <span className="text-xl font-bold text-slate-900">
                  {managerLoggedIn && !managerLoggedOut ? 'Online' : managerLoggedOut ? 'Offline' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Grid: Employee Table & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Employee Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Employee Login & Logout Activity</h3>
              <span className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-500">Live Updates</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Login</th>
                    <th className="px-5 py-4">Logout</th>
                    <th className="px-5 py-4 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employeeData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-400">No activity recorded today.</td>
                    </tr>
                  ) : (
                    employeeData.map((emp, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              emp.status === 'Online' ? 'bg-emerald-500' :
                              emp.status === 'Offline' ? 'bg-slate-400' : 'bg-rose-500'
                            }`}></span>
                            <div>
                              <p className="font-bold text-slate-800">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-600">{emp.login}</td>
                        <td className="px-5 py-4 font-mono text-slate-600">{emp.logout}</td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-800">
                          {emp.hours}
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
            <div className="p-5 flex-1 relative">
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
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                <Send className="w-4 h-4" /> Submit to CEO
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
