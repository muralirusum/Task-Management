import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  LogOut, 
  CheckCircle2, 
  Send,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';

export const AttendancePage = () => {
  const { user } = useAuth();
  const { markAttendance, requestLeave, getUserLogs, getUserLeaves } = useAttendance();

  const [loggedIn, setLoggedIn] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [loginTime, setLoginTime] = useState('--:-- --');
  const [logoutTime, setLogoutTime] = useState('--:-- --');
  const [loginTimestamp, setLoginTimestamp] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(null);
  
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    // Check if user already logged in today
    if (user) {
      const todayLogs = getUserLogs(user._id || user.id).filter(log => log.date === new Date().toLocaleDateString('en-GB'));
      const loginLog = todayLogs.find(l => l.action === 'login');
      const logoutLog = todayLogs.find(l => l.action === 'logout');
      
      if (loginLog) {
        setLoggedIn(true);
        setLoginTime(new Date(loginLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        setLoginTimestamp(loginLog.timestamp);
      }
      
      if (logoutLog) {
        setLoggedOut(true);
        setLogoutTime(new Date(logoutLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        if (loginLog) {
          setFinalDuration(Math.floor((logoutLog.timestamp - loginLog.timestamp) / 1000));
        }
      }
    }
  }, [user]);

  useEffect(() => {
    let interval = null;
    if (loggedIn && !loggedOut && loginTimestamp) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - loginTimestamp) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loggedIn, loggedOut, loginTimestamp]);

  const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleLogin = () => {
    setLoggedIn(true);
    setLoginTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    setLoginTimestamp(Date.now());
    markAttendance(user, 'login');
  };

  const handleLogout = () => {
    setLoggedOut(true);
    setLogoutTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    if (loginTimestamp) {
      setFinalDuration(Math.floor((Date.now() - loginTimestamp) / 1000));
    }
    markAttendance(user, 'logout');
  };

  const submitLeaveRequest = (e) => {
    e.preventDefault();
    if (!leaveType || !fromDate || !toDate) return;
    
    // Calculate days
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track your daily login and logout activity
          </p>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Daily Login Time */}
        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Daily Login Time</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{loggedIn ? loginTime : '--:-- --'}</p>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {currentDate}
            </p>
          </div>
        </div>

        {/* Daily Logout Time */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Daily Logout Time</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{loggedOut ? logoutTime : '--:-- --'}</p>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {currentDate}
            </p>
          </div>
        </div>

        {/* Total Working Hours */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Total Working Hours</p>
            {loggedIn && !loggedOut ? (
              <>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatDuration(elapsedSeconds)}</p>
                <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Currently Working
                </div>
              </>
            ) : loggedOut ? (
              <>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatDuration(finalDuration || elapsedSeconds)}</p>
                <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 font-semibold">
                  ✔ Work Session Completed
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-900 mt-1">00h 00m 00s</p>
                <p className="text-[10px] text-slate-500 mt-1">Today</p>
              </>
            )}
          </div>
        </div>

        {/* Attendance Status */}
        <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Attendance Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-sm font-bold rounded-full flex items-center gap-1 ${loggedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {loggedIn ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {loggedIn ? 'Present' : 'Not Logged In'}
              </span>
            </div>
            {loggedIn && !loggedOut && <p className="text-[10px] text-teal-600 font-medium mt-1">On Time</p>}
          </div>
        </div>

      </div>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Login & Logout Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-600 font-bold text-lg">
            <LogIn className="w-5 h-5" /> Daily Login & Logout
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600">Login Time</p>
                  <p className="text-lg font-bold text-slate-900">{loggedIn ? loginTime : '--:-- --'}</p>
                </div>
              </div>
              <div className={`text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 ${loggedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {loggedIn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>} 
                {loggedIn ? 'Logged In' : 'Not Logged In'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600">Logout Time</p>
                  <p className="text-lg font-bold text-slate-900">{loggedOut ? logoutTime : '--:-- --'}</p>
                </div>
              </div>
              <div className={`text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 ${loggedOut ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {loggedOut ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>}
                {loggedOut ? 'Logged Out' : 'Not Logged Out'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleLogin}
              disabled={loggedIn}
              className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${loggedIn ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <LogIn className="w-4 h-4" /> Mark Login
            </button>
            <button 
              onClick={handleLogout}
              disabled={!loggedIn || loggedOut}
              className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${!loggedIn || loggedOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'}`}
            >
              <LogOut className="w-4 h-4" /> Mark Logout
            </button>
          </div>
        </div>

        {/* Leave Request Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              Leave Request
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>

          <form className="space-y-4" onSubmit={submitLeaveRequest}>
            {leaveSubmitted && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Leave request submitted successfully!
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-xs font-semibold text-slate-700 sm:w-24 shrink-0">Leave Type</label>
              <select 
                value={leaveType}
                onChange={e => setLeaveType(e.target.value)}
                required
                className="flex-1 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option value="">Select Leave Type</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Paid Leave">Paid Leave</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-xs font-semibold text-slate-700 sm:w-24 shrink-0">From Date</label>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  required
                  className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-slate-700 shrink-0">To Date</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    required
                    className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <label className="text-xs font-semibold text-slate-700 sm:w-24 shrink-0 pt-2">Reason</label>
              <textarea 
                rows="3" 
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="flex-1 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 resize-none"
                placeholder="Enter reason for leave"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                <Send className="w-4 h-4" /> Submit Leave Request
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
