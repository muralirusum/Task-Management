import React from 'react';
import { MessageSquare, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

export const CeoCommunicationAnalytics = ({ activeMembersCount = 5 }) => {
  const chartData = [
    { day: 'Mon', count: 85 },
    { day: 'Tue', count: 110 },
    { day: 'Wed', count: 95 },
    { day: 'Thu', count: 127 },
    { day: 'Fri', count: 140 },
  ];

  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md mb-4 flex items-center justify-between gap-4 animate-in fade-in duration-200">
      {/* Overview Stats */}
      <div className="flex items-center gap-6">
        <div>
          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" /> Messages Today
          </div>
          <p className="text-xl font-extrabold text-white mt-0.5">127</p>
        </div>

        <div className="h-8 w-px bg-slate-800"></div>

        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Active Conversations
          </div>
          <p className="text-xl font-extrabold text-white mt-0.5">18</p>
        </div>

        <div className="h-8 w-px bg-slate-800"></div>

        <div>
          <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> Avg Response Rate
          </div>
          <p className="text-xl font-extrabold text-white mt-0.5">92%</p>
        </div>

        <div className="h-8 w-px bg-slate-800"></div>

        <div>
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Members
          </div>
          <p className="text-xl font-extrabold text-white mt-0.5">{activeMembersCount}</p>
        </div>
      </div>

      {/* Mini Bar Chart */}
      <div className="w-36 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Tooltip
              contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ color: '#38bdf8' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CeoCommunicationAnalytics;
