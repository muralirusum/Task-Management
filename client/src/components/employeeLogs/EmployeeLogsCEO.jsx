import React, { useState } from 'react';
import { 
  Users, UserCheck, UserMinus, ShieldCheck, AlertCircle, TrendingUp,
  Clock, CheckCircle2, ChevronRight, Filter, Download, Briefcase, MapPin, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { MapModal } from '../common/MapModal';

export const EmployeeLogsCEO = () => {
  const { user } = useAuth();
  const { logs, leaves, updateLeaveStatus, getTodayLogs, clearLogs, deleteUserLogs } = useAttendance();
  const [filterRole, setFilterRole] = useState('All'); // 'All', 'Manager', 'Employee'
  const [showMap, setShowMap] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all employee attendance history logs?")) {
      if (clearLogs) await clearLogs();
    }
  };

  // Month selector for export
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Compute Employee Data for Table
  const formatLocationDisplay = (loc) => {
    const defaultLabel = 'cGxPTech.guntur';
    const defaultAddr = 'cGxPTech.guntur, Autonagar, Gaddipadu, Takkellapadu, Pedakakani, Guntur, Andhra Pradesh, 522509, India';
    
    if (!loc) {
      return {
        address: defaultAddr,
        latitude: 16.3185626,
        longitude: 80.4744787,
        shortText: defaultLabel
      };
    }
    if (typeof loc === 'string') {
      return {
        address: loc.includes('cGxPTech') ? loc : `${defaultLabel} (${loc})`,
        latitude: 16.3185626,
        longitude: 80.4744787,
        shortText: defaultLabel
      };
    }
    if (typeof loc === 'object') {
      const lat = loc.latitude || loc.lat || 16.3185626;
      const lng = loc.longitude || loc.lng || 80.4744787;
      const addr = loc.address || defaultAddr;
      return {
        address: addr,
        latitude: lat,
        longitude: lng,
        shortText: defaultLabel
      };
    }
    return {
      address: defaultAddr,
      latitude: 16.3185626,
      longitude: 80.4744787,
      shortText: defaultLabel
    };
  };

  const todayLogs = getTodayLogs();
  const employeeMap = {};
  
  // Process logs chronologically
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
        duration: '--',
        loginLocation: null,
        logoutLocation: null
      };
    }
    
    const emp = employeeMap[log.userId];
    
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

  const filteredActivity = Object.values(employeeMap).filter(row => {
    const isCeoRow = ['ceo', 'main'].includes(row.role?.toLowerCase());
    if (isCeoRow && String(row.id) === String(user?._id || user?.id)) return false;
    if (filterRole === 'Manager') return ['manager', 'middle'].includes(row.role?.toLowerCase());
    if (filterRole === 'Employee') return ['employee', 'last'].includes(row.role?.toLowerCase());
    return true;
  }).map(emp => {
      let currentTotalMs = 0;
      if (emp.loginTime && emp.logoutTime) {
         currentTotalMs = emp.logoutTime - emp.loginTime;
      } else if (emp.loginTime && emp.status === 'Active') {
         currentTotalMs = Date.now() - emp.loginTime;
      }
      
      const hoursStr = currentTotalMs > 0 ? formatDuration(Math.floor(currentTotalMs / 1000)) : '--';
      
      let statusIndicator = '⚫ Offline';
      let statusClass = 'text-slate-500 bg-slate-100 border border-slate-200 font-bold';
      
      if (emp.status === 'Active') {
        statusIndicator = '🟢 Active';
        statusClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold';
      } else if (emp.status === 'Completed' || emp.logoutTime) {
        statusIndicator = '🔵 Logged Out';
        statusClass = 'text-blue-700 bg-blue-50 border border-blue-200 font-bold';
      }
      
      return {
        ...emp,
        duration: hoursStr,
        statusIndicator,
        statusClass
      };
  });

  const totalPresent = filteredActivity.length;
  const currentlyOnline = filteredActivity.filter(a => ['Active', 'Online'].includes(a.status)).length;
  
  // Get today's leaves
  const todayStr = new Date().toISOString().split('T')[0];
  const onLeaveToday = leaves.filter(l => {
    if (l.status !== 'Approved') return false;
    const start = new Date(l.fromDate).toISOString().split('T')[0];
    const end = new Date(l.toDate).toISOString().split('T')[0];
    const isToday = todayStr >= start && todayStr <= end;
    if (!isToday) return false;

    if (filterRole === 'Manager') return ['manager', 'middle'].includes(l.role?.toLowerCase());
    if (filterRole === 'Employee') return ['employee', 'last'].includes(l.role?.toLowerCase());
    return true;
  }).length;

  // All organization leaves (excluding CEO's own leaves and pending emergency leaves)
  const orgLeaves = leaves.filter(l => {
    if (String(l.userId) === String(user._id || user.id)) return false;
    if (l.leaveType === 'Emergency Leave' && l.status === 'Pending') return false;
    return true;
  });

  const exportToCSV = () => {
    // 1. Filter logs for the selected month and selected role
    const monthLogs = logs.filter(log => {
      if (filterRole === 'Manager' && !['manager', 'middle'].includes(log.role?.toLowerCase())) return false;
      if (filterRole === 'Employee' && !['employee', 'last'].includes(log.role?.toLowerCase())) return false;
      const logMonth = new Date(log.timestamp).toISOString().slice(0, 7);
      return logMonth === selectedMonth;
    });

    if (monthLogs.length === 0) {
      alert(`No attendance data found for ${filterRole}s in ${selectedMonth}`);
      return;
    }

    // 2. Group by date and user
    const map = {};
    monthLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      const key = `${dateStr}_${log.userId}`;
      if (!map[key]) {
        map[key] = {
          date: dateStr,
          name: log.name,
          role: log.role,
          department: log.department,
          login: null,
          logout: null,
          loginTs: null,
          logoutTs: null
        };
      }
      if (log.action === 'login') {
        map[key].login = new Date(log.timestamp).toLocaleTimeString();
        map[key].loginTs = log.timestamp;
      } else if (log.action === 'logout') {
        map[key].logout = new Date(log.timestamp).toLocaleTimeString();
        map[key].logoutTs = log.timestamp;
      }
    });

    // 3. Generate CSV rows
    const headers = ['Date', 'Employee Name', 'Role', 'Department', 'Login Time', 'Logout Time', 'Hours Worked'];
    
    const rows = Object.values(map).map(row => {
      let duration = '0h 0m';
      if (row.loginTs && row.logoutTs) {
        const diff = new Date(row.logoutTs) - new Date(row.loginTs);
        if (diff > 0) {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${h}h ${m}m`;
        }
      } else if (row.loginTs && !row.logoutTs) {
        duration = 'Missing Logout';
      }

      return [
        `"${row.date}"`,
        `"${row.name}"`,
        `"${row.role}"`,
        `"${row.department}"`,
        `"${row.login || '--'}"`,
        `"${row.logout || '--'}"`,
        `"${duration}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${filterRole}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            {['All', 'Manager', 'Employee'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterRole === role 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {role}s
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"></div>

          <div className="flex items-center gap-2">
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Present Today</p>
            <h3 className="text-2xl font-black text-slate-800">{totalPresent}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Currently Online</p>
            <h3 className="text-2xl font-black text-slate-800">{currentlyOnline}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">On Leave</p>
            <h3 className="text-2xl font-black text-slate-800">{onLeaveToday}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Activity & Login Logs */}
        <div className="space-y-6">
          
          {/* Employee Login / Logout Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Company-wide Login / Logout Activity</h3>
              </div>
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-2">Employee</th>
                    <th className="px-4 py-2">Login</th>
                    <th className="px-4 py-2">Logout</th>
                    <th className="px-4 py-2">Hours Worked</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActivity.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">No activity matches the filter.</td>
                    </tr>
                  ) : (
                    filteredActivity.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{row.name}</p>
                          <p className="text-[10px] text-slate-500">{row.role} - {row.department}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{row.login}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{row.logout}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">{row.duration}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[10px] min-w-[170px] truncate" title={row.loginLocation?.address || 'cGxPTech.guntur'}>
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">cGxPTech.guntur</span>
                            <button
                              onClick={() => {
                                setMapFocus([row.loginLocation?.latitude || 16.3185626, row.loginLocation?.longitude || 80.4744787]);
                                setShowMap(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 ml-0.5 shrink-0"
                              title="View Map Location"
                            >
                              🗺️
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${row.statusClass}`}>
                            {row.statusIndicator}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete activity logs for ${row.name}?`)) {
                                deleteUserLogs(row.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={`Delete logs for ${row.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

          {/* Organization Leave Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Team Leave Requests</h3>
              <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">Needs Approval</span>
            </div>
            <div className="p-5 flex-1 overflow-auto max-h-[500px]">
              {orgLeaves.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs">No leave requests.</div>
              ) : (
                <div className="space-y-4">
                  {orgLeaves.map(leave => (
                    <div key={leave.id || leave._id} className="border border-slate-200 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{leave.name} <span className="text-xs font-normal text-slate-500">({leave.role})</span></p>
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
                          <button onClick={() => updateLeaveStatus(leave._id || leave.id, 'Approved', user.name)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition-colors">Approve</button>
                          <button onClick={() => updateLeaveStatus(leave._id || leave.id, 'Rejected', user.name)} className="flex-1 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-bold transition-colors">Reject</button>
                        </div>
                      )}
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
      
      <MapModal 
        isOpen={showMap} 
        onClose={() => setShowMap(false)} 
        title="Company Location & Activity Map"
        center={mapFocus}
        locations={filteredActivity.flatMap(row => [
          row.loginLocation ? { ...row.loginLocation, name: row.name, role: row.role, status: 'Online', time: row.login } : null,
          row.logoutLocation && row.status === 'Offline' ? { ...row.logoutLocation, name: row.name, role: row.role, status: 'Offline', time: row.logout } : null
        ]).filter(Boolean)} 
      />
    </div>
  );
};
