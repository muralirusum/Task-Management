import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Building,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  LogIn,
  RotateCcw
} from 'lucide-react';

export const LoginPage = () => {
  const { login, register, verifyOtp, resendOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Mode: 'signin', 'signup', 'verify_otp', 'forgot'
  const [mode, setMode] = useState('signin');

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [resetToken, setResetToken] = useState('');
  const [showResetTokenInput, setShowResetTokenInput] = useState(false);

  // OTP Verification & 2-Min Timer State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes (120s)
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('cgxp_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (mode === 'verify_otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, resendTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleOtpBoxChange = (val, idx) => {
    if (/^[0-9]?$/.test(val)) {
      const newOtp = [...otp];
      newOtp[idx] = val;
      setOtp(newOtp);
      if (val && idx < 5) {
        const nextInput = document.getElementById(`otp-input-${idx + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-input-${idx - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''));
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('cgxp_remembered_email', email);
    } else {
      localStorage.removeItem('cgxp_remembered_email');
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      if (res.isUnverified) {
        setPendingEmail(res.email || email);
        setMode('verify_otp');
        setOtp(['', '', '', '', '', '']);
        setResendTimer(120);
        setCanResend(false);
        setError(res.message || 'Please verify your email before logging in.');
      } else {
        setError(res.message || 'Invalid email or password');
      }
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    setLoading(true);

    const res = await register({
      name,
      email,
      password,
      confirmPassword,
      role,
    });

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    const otpCode = otp.join('').trim();
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit OTP verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(pendingEmail || email, otpCode);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Invalid OTP code. Please check your email and try again.');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 && !canResend) return;
    resetMessages();
    setLoading(true);
    const res = await resendOtp(pendingEmail || email);
    if (res.success) {
      setSuccessMsg(res.message || `New 6-digit OTP code sent to ${pendingEmail || email}. Please check your email inbox.`);
      setResendTimer(120);
      setCanResend(false);
    } else {
      setError(res.message || 'Failed to resend OTP code.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError('Please enter your corporate email address');
      return;
    }

    setLoading(true);
    const res = await forgotPassword(email);
    if (res.success) {
      setSuccessMsg('Reset token generated. Enter token and new password below.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setShowResetTokenInput(true);
    } else {
      setError(res.message || 'Failed to request password reset');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!resetToken || !password || !confirmPassword) {
      setError('Please fill in reset token and new password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    setLoading(true);
    const res = await resetPassword(resetToken, password, confirmPassword);
    if (res.success) {
      setSuccessMsg(res.message || 'Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setMode('signin');
        setShowResetTokenInput(false);
        setPassword('');
        setConfirmPassword('');
      }, 2000);
    } else {
      setError(res.message || 'Failed to reset password');
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
            Production Workspace Authentication & Access Control
          </p>
        </div>

        {/* Main Auth Form Container */}
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            
            {/* Header Title & Back Arrow / Create Account Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {mode !== 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      resetMessages();
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-xs"
                    title="Back to Sign In"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {mode === 'signup' ? 'Create New Account' : mode === 'verify_otp' ? 'Verify Email OTP' : mode === 'forgot' ? 'Reset Password' : 'Account Sign In'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {mode === 'signup' ? 'Register corporate account' : mode === 'verify_otp' ? 'Enter 6-digit verification code' : mode === 'forgot' ? 'Recover account access' : 'Access your corporate workspace'}
                  </p>
                </div>
              </div>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    resetMessages();
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </button>
              )}
            </div>

            {/* Role Switcher Pill Bar */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              {[
                { label: 'CEO', value: 'ceo' },
                { label: 'Manager', value: 'manager' },
                { label: 'Employee', value: 'employee' }
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                    role === r.value
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-in fade-in">
                {error}
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center animate-in fade-in">
                {successMsg}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. SIGN IN FORM */}
            {/* ========================================================================= */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
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
                      placeholder="user@cgxptech.com"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
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
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
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
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        resetMessages();
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* 2. SIGN UP FORM */}
            {/* ========================================================================= */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Singh"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram.singh@cgxptech.com"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                    />
                    <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Remember my credentials on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* 3. FORGOT / RESET PASSWORD FORM */}
            {/* ========================================================================= */}
            {mode === 'forgot' && (
              <div className="space-y-4">
                {!showResetTokenInput ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Corporate Email Address *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@cgxptech.com"
                          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                        />
                        <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      {loading ? 'Processing...' : 'Request Password Reset Token'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Reset Token *
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Paste reset token here"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
