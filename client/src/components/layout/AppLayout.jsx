import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const AppLayout = () => {
  const { isActualCEO, previewRole, setPreviewRole } = useAuth();

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {isActualCEO && previewRole && (
          <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-xs font-medium z-50 shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-200" />
              <span>Viewing as {previewRole === 'manager' ? 'Manager' : 'Employee'} — CEO Preview Mode</span>
            </div>
            <button 
              onClick={() => setPreviewRole(null)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white font-bold tracking-wide"
            >
              Back to CEO View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
