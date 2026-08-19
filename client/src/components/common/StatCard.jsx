import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'brand', trend }) => {
  const colorStyles = {
    brand: { iconBg: 'bg-blue-50 border-blue-200', iconText: 'text-blue-600' },
    emerald: { iconBg: 'bg-emerald-50 border-emerald-200', iconText: 'text-emerald-600' },
    blue: { iconBg: 'bg-blue-50 border-blue-200', iconText: 'text-blue-600' },
    amber: { iconBg: 'bg-amber-50 border-amber-200', iconText: 'text-amber-600' },
    rose: { iconBg: 'bg-rose-50 border-rose-200', iconText: 'text-rose-600' },
    purple: { iconBg: 'bg-purple-50 border-purple-200', iconText: 'text-purple-600' },
  };

  const currentTheme = colorStyles[color] || colorStyles.brand;

  return (
    <div
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-600 mt-1 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${currentTheme.iconBg} ${currentTheme.iconText} transition-transform group-hover:scale-110 shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500 font-medium">
          {trend}
        </div>
      )}
    </div>
  );
};
