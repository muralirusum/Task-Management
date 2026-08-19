import React from 'react';
import { ShieldCheck, UserCheck, User, ChevronRight, Mail, Phone, Building } from 'lucide-react';

export const OrgChartView = ({ treeData, onNodeClick }) => {
  if (!treeData || treeData.length === 0) {
    return <p className="text-xs text-slate-500 text-center py-8">No hierarchy data available</p>;
  }

  const renderNode = (node, depth = 0) => {
    const isLevel1 = node.level === 1 || node.role === 'main';
    const isLevel2 = node.level === 2 || node.role === 'middle';

    const Icon = isLevel1 ? ShieldCheck : isLevel2 ? UserCheck : User;

    return (
      <div key={node._id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          onClick={() => onNodeClick && onNodeClick(node._id)}
          className={`p-4 rounded-2xl border transition-all duration-200 shadow-lg min-w-[240px] max-w-[280px] text-center ${onNodeClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''} ${
            isLevel1
              ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/40 shadow-rose-950/30'
              : isLevel2
              ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900 border-indigo-500/40 shadow-indigo-950/30'
              : 'bg-gradient-to-b from-slate-850 to-slate-900 border-slate-700/60 shadow-slate-950/30'
          }`}
        >
          <div className="relative inline-block mx-auto mb-2">
            <img
              src={node.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
              alt={node.name}
              className={`w-14 h-14 rounded-2xl object-cover mx-auto border-2 ${
                isLevel1 ? 'border-rose-400' : isLevel2 ? 'border-indigo-400' : 'border-emerald-400'
              }`}
            />
            <div
              className={`absolute -bottom-1 -right-1 p-1 rounded-md text-white ${
                isLevel1 ? 'bg-rose-500' : isLevel2 ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
            >
              <Icon className="w-3 h-3" />
            </div>
          </div>

          <h4 className="text-sm font-bold text-white">{node.name}</h4>
          <p
            className={`text-xs font-semibold mt-0.5 ${
              isLevel1 ? 'text-rose-300' : isLevel2 ? 'text-indigo-300' : 'text-emerald-300'
            }`}
          >
            {node.position}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{node.department} Department</p>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono">
              Level {node.level} • {node.level === 1 ? '1. CEO' : node.level === 2 ? '2. MANAGER' : '3. EMPLOYEE'}
            </span>
          </div>
        </div>

        {/* Children connections */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center mt-3">
            {/* Vertical connector down */}
            <div className="w-0.5 h-6 bg-indigo-500/40" />

            {/* Horizontal branch line */}
            <div className="flex justify-center gap-6 relative pt-4">
              {node.children.map((child) => (
                <div key={child._id} className="flex flex-col items-center relative">
                  {/* Vertical connector down to child */}
                  <div className="w-0.5 h-4 bg-indigo-500/40 -mt-4 mb-2" />
                  {renderNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto py-6 flex justify-center">
      <div className="flex gap-8 justify-center min-w-max">
        {treeData.map((rootNode) => renderNode(rootNode))}
      </div>
    </div>
  );
};
