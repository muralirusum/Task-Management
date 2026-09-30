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

  const fetchAttendanceData = async (showLoading = true) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      const [logsRes, leavesRes] = await Promise.all([
        api.get('/attendance/logs'),
        api.get('/attendance/leaves')
      ]);

      if (logsRes.success) {
        setLogs(logsRes.logs);
      }
      if (leavesRes.success) setLeaves(leavesRes.leaves);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    
    // Set up polling for live updates across tabs
    const intervalId = setInterval(() => {
      fetchAttendanceData(false); // pass false to avoid resetting loading state
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [user?._id || user?.id]);

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: 'Geolocation not supported by browser' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const deviceInfo = navigator.userAgent;
          
          let address = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          try {
             // zoom=18 for street-level exactness, accept-language=en to force English
             const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=en`);
             if (res.ok) {
               const data = await res.json();
               if (data.display_name) address = data.display_name.split(',').slice(0, 4).join(',');
             }
          } catch (e) {
             // Ignore error and use coords
          }

          resolve({
            latitude: lat,
            longitude: lng,
            accuracy,
            deviceInfo,
            address
          });
        },
        (err) => {
          console.warn('Geolocation fallback to Office coordinates:', err.message);
          resolve({
            latitude: 16.3185626,
            longitude: 80.4744787,
            accuracy: 15,
            deviceInfo: navigator.userAgent,
            address: 'cGxPTech.guntur, Autonagar, Gaddipadu, Takkellapadu, Pedakakani, Guntur, AP 522509'
          });
        },
        { timeout: 4000, enableHighAccuracy: true }
      );
    });
  };

  const markAttendance = async (user, action) => {
    try {
      let location = await getLocation();
      if (!location || location.error) {
        location = {
          latitude: 16.3185626,
          longitude: 80.4744787,
          accuracy: 15,
          address: 'cGxPTech.guntur, Autonagar, Guntur, AP 522509'
        };
      }
      
      const payload = {
        action,
        date: new Date().toLocaleDateString('en-GB'),
        timestamp: Date.now(),
        location
      };
      
      const res = await api.post('/attendance/log', payload);
      if (res.success) {
        setLogs(prev => {
          const exists = prev.find(l => l._id === res.log._id);
          if (exists) {
            return prev.map(l => l._id === res.log._id ? res.log : l);
          }
          return [res.log, ...prev];
        });
        await fetchAttendanceData(false);
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

  const clearLogs = async () => {
    try {
      const res = await api.delete('/attendance/logs');
      if (res.success) {
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to clear attendance logs:', error);
    }
  };

  const deleteUserLogs = async (userId) => {
    try {
      const res = await api.delete(`/attendance/logs/user/${userId}`);
      if (res.success) {
        setLogs(prev => prev.filter(l => String(l.userId) !== String(userId)));
      }
    } catch (error) {
      console.error('Failed to delete user attendance logs:', error);
    }
  };

  const getTodayLogs = () => {
    const todayStr = new Date().toLocaleDateString('en-GB');
    const todayDateStr = new Date().toDateString();
    return logs.filter(log => {
      if (log.date === todayStr) return true;
      if (log.timestamp) {
        return new Date(log.timestamp).toDateString() === todayDateStr;
      }
      return false;
    });
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
      clearLogs,
      deleteUserLogs,
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
