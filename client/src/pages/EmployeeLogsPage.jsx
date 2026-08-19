import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { EmployeeLogsCEO } from '../components/employeeLogs/EmployeeLogsCEO';
import { EmployeeLogsManager } from '../components/employeeLogs/EmployeeLogsManager';

export const EmployeeLogsPage = () => {
  const { isMain, isMiddle } = useAuth();

  if (isMain) {
    return <EmployeeLogsCEO />;
  }

  if (isMiddle) {
    return <EmployeeLogsManager />;
  }

  // Fallback for regular employees who shouldn't access this page directly.
  return <Navigate to="/" replace />;
};
