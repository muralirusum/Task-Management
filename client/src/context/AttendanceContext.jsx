import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext();

export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [logsRes, leavesRes] = await Promise.all([
        api.get('/attendance/logs'),
        api.get('/attendance/leaves')
      ]);

      if (logsRes.success) setLogs(logsRes.logs);
      if (leavesRes.success) setLeaves(leavesRes.leaves);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const markAttendance = async (user, action) => {
    try {
      const payload = {
        action,
        date: new Date().toLocaleDateString('en-GB'),
        timestamp: Date.now()
      };
      const res = await api.post('/attendance/log', payload);
      if (res.success) {
        setLogs(prev => [res.log, ...prev]);
        return res.log;
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      throw error;
    }
  };

  const requestLeave = async (user, details) => {
    try {
      const res = await api.post('/attendance/leave', details);
      if (res.success) {
        setLeaves(prev => [res.leave, ...prev]);
        return res.leave;
      }
    } catch (error) {
      console.error('Failed to request leave:', error);
      throw error;
    }
  };

  const updateLeaveStatus = async (leaveId, status, approverName) => {
    try {
      const res = await api.patch(`/attendance/leave/${leaveId}`, { status });
      if (res.success) {
        setLeaves(prev => prev.map(leave => 
          // Match MongoDB _id instead of just id
          (leave._id === leaveId || leave.id === leaveId) 
            ? res.leave 
            : leave
        ));
      }
    } catch (error) {
      console.error('Failed to update leave status:', error);
      throw error;
    }
  };

  const getTodayLogs = () => {
    const today = new Date().toLocaleDateString('en-GB');
    return logs.filter(log => log.date === today);
  };

  const getUserLogs = (userId) => {
    return logs.filter(log => String(log.userId) === String(userId));
  };

  const getUserLeaves = (userId) => {
    return leaves.filter(leave => String(leave.userId) === String(userId));
  };

  return (
    <AttendanceContext.Provider value={{
      logs,
      leaves,
      loading,
      markAttendance,
      requestLeave,
      updateLeaveStatus,
      getTodayLogs,
      getUserLogs,
      getUserLeaves,
      refreshData: fetchAttendanceData
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};
