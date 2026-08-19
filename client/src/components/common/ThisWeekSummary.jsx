import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Timer, CheckSquare, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { SummaryModal } from './SummaryModals';

export const ThisWeekSummary = () => {
  const [range, setRange] = useState('thisWeek');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [modalState, setModalState] = useState({ isOpen: false, type: null });

  const rangeLabels = {
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/time/summary?range=${range}`);
        if (response.success) {
          setData(response);
        } else {
          setError('Failed to fetch summary data');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [range]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = (type) => {
    if (data && data.details) {
      setModalState({ isOpen: true, type });
    }
  };

  const summary = data?.summary || {
    totalWorkedHours: 0,
    totalWorkedMinutes: 0,
    estimatedHours: 0,
    estimatedMinutes: 0,
    overtimeHours: 0,
    overtimeMinutes: 0,
    completedTasks: 0,
    totalTasks: 0,
  };

  return (
    <>
      <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm space-y-5 relative">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-extrabold text-slate-800 tracking-tight">Period Summary</h3>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              {rangeLabels[range]} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
                {Object.entries(rangeLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setRange(key);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${range === key ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-bold">Loading summary...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-rose-500">
            <AlertCircle className="w-8 h-8" />
            <span className="text-xs font-bold">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Worked */}
            <div 
              onClick={() => handleCardClick('worked')}
              className="p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div>
                <p className="text-[12px] font-bold text-slate-500 mb-1 tracking-wide group-hover:text-indigo-600 transition-colors">Total Worked</p>
                <div className="flex items-baseline gap-[2px] text-[#1e293b]">
                  <span className="text-[26px] font-black">{summary.totalWorkedHours}</span>
                  <span className="text-[13px] font-bold text-slate-800 mr-1.5">h</span>
                  <span className="text-[26px] font-black">{summary.totalWorkedMinutes < 10 ? '0'+summary.totalWorkedMinutes : summary.totalWorkedMinutes}</span>
                  <span className="text-[13px] font-bold text-slate-800">m</span>
                </div>
              </div>
              <div className="w-[42px] h-[42px] rounded-full bg-[#f0f5ff] text-[#4f46e5] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            {/* Estimated */}
            <div 
              onClick={() => handleCardClick('estimated')}
              className="p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div>
                <p className="text-[12px] font-bold text-slate-500 mb-1 tracking-wide group-hover:text-indigo-600 transition-colors">Estimated</p>
                <div className="flex items-baseline gap-[2px] text-[#1e293b]">
                  <span className="text-[26px] font-black">{summary.estimatedHours}</span>
                  <span className="text-[13px] font-bold text-slate-800 mr-1.5">h</span>
                  <span className="text-[26px] font-black">{summary.estimatedMinutes < 10 ? '0'+summary.estimatedMinutes : summary.estimatedMinutes}</span>
                  <span className="text-[13px] font-bold text-slate-800">m</span>
                </div>
              </div>
              <div className="w-[42px] h-[42px] rounded-full bg-[#f5f3ff] text-[#6366f1] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            {/* Overtime */}
            <div 
              onClick={() => handleCardClick('overtime')}
              className="p-4 rounded-2xl border border-orange-100 bg-[#fff9f2] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div>
                <p className="text-[12px] font-bold text-[#8c6b4f] mb-1 tracking-wide group-hover:text-orange-700 transition-colors">Overtime</p>
                <div className="flex items-baseline gap-[2px] text-[#ea580c]">
                  <span className="text-[26px] font-black">{summary.overtimeHours}</span>
                  <span className="text-[13px] font-bold text-[#f97316] mr-1.5">h</span>
                  <span className="text-[26px] font-black">{summary.overtimeMinutes < 10 ? '0'+summary.overtimeMinutes : summary.overtimeMinutes}</span>
                  <span className="text-[13px] font-bold text-[#f97316]">m</span>
                </div>
              </div>
              <div className="w-[42px] h-[42px] rounded-full bg-[#ffedd5] text-[#ea580c] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>

            {/* Tasks Completed */}
            <div 
              onClick={() => handleCardClick('tasks')}
              className="p-4 rounded-2xl border border-emerald-100 bg-[#f0fdf4] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div>
                <p className="text-[12px] font-bold text-[#4b7a5a] mb-1 tracking-wide group-hover:text-emerald-700 transition-colors">Tasks Completed</p>
                <div className="flex items-baseline gap-1.5 text-[#16a34a]">
                  <span className="text-[26px] font-black">{summary.completedTasks}</span>
                  <span className="text-[18px] font-bold text-[#4ade80]">/</span>
                  <span className="text-[20px] font-black text-[#22c55e]">{summary.totalTasks}</span>
                </div>
              </div>
              <div className="w-[42px] h-[42px] rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        )}
      </div>

      <SummaryModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ isOpen: false, type: null })} 
        type={modalState.type} 
        details={data?.details}
        summary={summary}
      />
    </>
  );
};
