import React from 'react';
import { 
  Users, UserCheck, UserMinus, ShieldCheck, AlertCircle, TrendingUp,
  Clock, CheckCircle2, ChevronRight, Filter, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

export const EmployeeLogsCEO = () => {
  const { user } = useAuth();
  const { logs, leaves, updateLeaveStatus, getTodayLogs } = useAttendance();

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
        status: 'Offline'
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

  const loginActivity = Object.values(employeeMap);

  // All pending leaves (from Managers or Employees)
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Logs & Attendance Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor organization-wide employee activity, attendance, login/logout records and leave approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Activity & Login Logs */}
        <div className="space-y-6">
          
          {/* Employee Login / Logout Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Company-wide Login / Logout Activity</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Employee</th>
                    <th className="px-4 py-2">Login</th>
                    <th className="px-4 py-2">Logout</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loginActivity.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No activity recorded today.</td>
                    </tr>
                  ) : (
                    loginActivity.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="text-[10px] text-slate-500">{row.role} - {row.department}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{row.login}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{row.logout}</td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 font-semibold ${
                            row.status === 'Online' ? 'text-emerald-600' : 
                            row.status === 'Offline' ? 'text-slate-500' : 'text-rose-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              row.status === 'Online' ? 'bg-emerald-500' : 
                              row.status === 'Offline' ? 'bg-slate-400' : 'bg-rose-500'
                            }`} />
                            {row.status}
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

        {/* Right Column: Manager Requests */}
        <div className="space-y-6">

          {/* Manager Approval Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Pending Leave Approvals</h3>
              {pendingLeaves.length > 0 && <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-bold">{pendingLeaves.length} Pending</span>}
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              {pendingLeaves.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs">No pending leave requests.</div>
              ) : (
                <div className="p-4 space-y-4">
                  {pendingLeaves.map(leave => (
                    <div key={leave.id} className="border border-slate-200 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{leave.name} <span className="text-xs font-normal text-slate-500">({leave.role})</span></p>
                          <p className="text-xs text-slate-500">{leave.leaveType} ({leave.days} Days)</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">{leave.fromDate} to {leave.toDate}</p>
                      <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">"{leave.reason}"</p>
                      <div className="flex gap-2">
                        <button onClick={() => updateLeaveStatus(leave._id, 'Approved', user.name)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition-colors">Approve</button>
                        <button onClick={() => updateLeaveStatus(leave._id, 'Rejected', user.name)} className="flex-1 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-bold transition-colors">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 italic">
              * Note: You can approve leaves from Managers directly, or override pending Employee leaves.
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
