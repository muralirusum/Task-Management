import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  User,
  ArrowRight,
  Lock,
  Mail,
  Building2,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, switchDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('employ@novatech.com');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const demoAccounts = [
    {
      title: 'Level 1',
      name: 'CEO',
      position: 'Chief Executive Officer',
      email: 'ceo@novatech.com',
      badge: 'Full Org Oversight',
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
      icon: ShieldCheck,
    },
    {
      title: 'Level 2',
      name: 'MANAGER',
      position: 'Operations Manager',
      email: 'manager@novatech.com',
      badge: 'Manages Operations Team',
      color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300',
      icon: UserCheck,
    },
    {
      title: 'Level 3',
      name: 'EMPLOY',
      position: 'Operations Employee',
      email: 'employ@novatech.com',
      badge: 'Operations Deliverables',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
      icon: User,
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    const res = await switchDemo(demoEmail);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Demo login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="flex border-2 border-[#2264ad] rounded-lg overflow-hidden shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white text-[#2264ad] font-extrabold text-3xl sm:text-4xl px-3 sm:px-4 py-2 tracking-tight">
              cGxP<span className="text-xl sm:text-2xl ml-0.5 relative top-[-4px]">.</span>
            </div>
            <div className="bg-[#2264ad] text-white font-extrabold text-3xl sm:text-4xl px-3 sm:px-4 py-2 tracking-tight flex items-center">
              Tech
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Welcome to cGxP.Tech
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto font-medium">
            Sign in to workspace
          </p>
        </div>



        {/* 2. BOTTOM SECTION: ACCOUNT SIGN IN ENTERING (CENTERED DOWN BELOW) */}
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1 text-center">Account Sign In</h3>
            <p className="text-xs text-slate-500 mb-6 text-center font-medium">
              Enter your corporate credentials to access your workspace
            </p>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-5 text-center">
                {error}
              </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              {[
                { label: 'CEO', email: 'ceo@novatech.com' },
                { label: 'Manager', email: 'manager@novatech.com' },
                { label: 'Employee', email: 'employ@novatech.com' }
              ].map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => {
                    setEmail(role.email);
                    setPassword('Demo@123');
                  }}
                  className={`flex-1 px-2 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${
                    email === role.email 
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. employ@novatech.com"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative mb-3">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-4 h-4 rounded border border-slate-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                      <Check className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
