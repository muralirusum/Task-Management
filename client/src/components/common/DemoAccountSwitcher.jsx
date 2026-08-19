import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ChevronDown, Check, ShieldCheck, UserCheck, User } from 'lucide-react';

export const DemoAccountSwitcher = () => {
  const { user, switchDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState(null);

  const personas = [
    {
      name: 'CEO',
      email: 'ceo@novatech.com',
      role: 'CEO',
      position: 'Chief Executive Officer',
      department: 'Executive Management',
      level: 1,
      tagColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: ShieldCheck,
    },
    {
      name: 'MANAGER',
      email: 'manager@novatech.com',
      role: 'MANAGER',
      position: 'Operations Manager',
      department: 'Operations',
      level: 2,
      tagColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: UserCheck,
    },
    {
      name: 'MANAGER 2 (Sales)',
      email: 'rahul@novatech.com',
      role: 'MANAGER',
      position: 'Sales Manager',
      department: 'Sales',
      level: 2,
      tagColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: UserCheck,
    },
    {
      name: 'EMPLOY',
      email: 'employ@novatech.com',
      role: 'EMPLOY',
      position: 'Operations Employee',
      department: 'Operations',
      level: 3,
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: User,
    },
    {
      name: 'EMPLOY 2 (Anjali)',
      email: 'anjali@novatech.com',
      role: 'EMPLOY',
      position: 'Operations Employee',
      department: 'Operations',
      level: 3,
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: User,
    },
    {
      name: 'EMPLOY 3 (Vikram)',
      email: 'vikram@novatech.com',
      role: 'EMPLOY',
      position: 'Sales Employee',
      department: 'Sales',
      level: 3,
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: User,
    },
    {
      name: 'EMPLOY 4 (Neha)',
      email: 'neha@novatech.com',
      role: 'EMPLOY',
      position: 'Sales Employee',
      department: 'Sales',
      level: 3,
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: User,
    },
  ];

  const handleSelect = async (email) => {
    if (user?.email === email) {
      setIsOpen(false);
      return;
    }
    setSwitchingEmail(email);
    await switchDemo(email);
    setSwitchingEmail(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 transition-all shadow-xs group"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-slate-600 font-medium">Role Switcher:</span>
        <span className="font-bold text-slate-900">{user?.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200 font-bold">
          L{user?.level}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">Switch Persona Hierarchy</p>
              <p className="text-[11px] text-slate-500 font-medium">Experience the app through different organizational access levels</p>
            </div>
            <div className="py-1 max-h-96 overflow-y-auto space-y-1 mt-1">
              {personas.map((p) => {
                const isCurrent = user?.email === p.email;
                const isSwitching = switchingEmail === p.email;
                const Icon = p.icon;

                return (
                  <button
                    key={p.email}
                    onClick={() => handleSelect(p.email)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border border-blue-300'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{p.name}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded border bg-blue-50 text-blue-700 border-blue-200 font-mono">
                            Level {p.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {p.position} • {p.department}
                        </p>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    {isSwitching && (
                      <span className="text-xs text-blue-600 animate-spin flex-shrink-0">⏳</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
