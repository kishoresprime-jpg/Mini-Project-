import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  GraduationCap,
  Building2,
  Phone,
  HelpCircle,
  Sparkles,
  Bell,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'demo'

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code & new pass, 3: success
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authentication failed. Please verify your institutional email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setActiveTab('credentials');
  };

  // Forgot password handler - Step 1: Request OTP
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setForgotError('');
    setIsForgotLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setGeneratedCode(res.data.resetCode);
      setForgotStep(2);
      setForgotSuccess(res.data.message || 'Verification security code generated.');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Unable to locate account with that email.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot password handler - Step 2: Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Password must contain at least 6 characters.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        resetCode,
        newPassword,
      });

      setForgotSuccess(res.data.message);
      setForgotStep(3);
      // Auto populate the login form with new password
      setEmail(forgotEmail);
      setPassword(newPassword);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      name: 'Dr. Arthur Vance',
      email: 'admin@college.edu',
      designation: 'Campus IT & Systems Director',
      badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
    },
    {
      role: 'Principal',
      name: 'Dr. Elizabeth Warren',
      email: 'principal@college.edu',
      designation: 'Head of Institution',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
    },
    {
      role: 'HOD (CSE)',
      name: 'Prof. Marcus Brody',
      email: 'hod.cse@college.edu',
      designation: 'Department Head (CSE)',
      badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    },
    {
      role: 'Faculty',
      name: 'Dr. Alex Mercer',
      email: 'alex.faculty@college.edu',
      designation: 'Associate Professor',
      badge: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800',
    },
    {
      role: 'Staff Member',
      name: 'David Miller',
      email: 'david.staff@college.edu',
      designation: 'Senior Lab Technologist',
      badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    },
    {
      role: 'Student',
      name: 'Rahul Verma',
      email: 'rahul.student@college.edu',
      designation: 'Final Year B.Tech CSE',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-primary-500 selection:text-white">
      {/* Top Institutional Header Bar */}
      <div className="border-b border-slate-800/80 bg-navy-950/90 px-4 py-2 text-[11px] text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">CAMPUS CLOUD PLATFORM</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 hidden sm:inline">NAAC Grade A++ Accredited &bull; AICTE Approved &bull; Autonomous Institution</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="font-medium text-slate-300">Session: 2026 - 2027</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Helpdesk: it-support@college.edu</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Column: Campus Overview & Visual Identity */}
        <div className="relative hidden lg:flex lg:w-7/12 flex-col justify-between p-12 bg-gradient-to-br from-navy-950 via-slate-900 to-primary-950 border-r border-slate-800 overflow-hidden">
          {/* Subtle background decorative grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Institution Brand */}
            <div className="flex items-center space-x-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-400 text-white font-black text-xl shadow-xl shadow-primary-600/30 ring-2 ring-white/10">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    COLLEGE<span className="text-primary-400">FLOW</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    Enterprise SSO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  Centralized Academic Governance & Workflow Management System
                </p>
              </div>
            </div>

            {/* Headline and Mission */}
            <div className="mt-14 max-w-xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-primary-300 font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                <span>Next-Gen Academic Automation & AI Optimization</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
                Empowering Institutions with Intelligent Workflow & Governance
              </h1>
              <p className="mt-3.5 text-sm text-slate-300 leading-relaxed font-normal">
                Seamless coordination from institutional projects and accreditation milestones to faculty workload balancing, deliverable reviews, and predictive delay-risk tracking.
              </p>

              {/* 4 Feature Pillars */}
              <div className="mt-8 grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 text-primary-400 font-semibold text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Hierarchical Access Control</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Strict role and department boundaries for 6 institutional tiers.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 text-primary-400 font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-Powered Task Allocation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Multi-criteria heuristic matching skills, capacity, and track record.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 text-primary-400 font-semibold text-xs">
                    <FileCheck className="w-4 h-4" />
                    <span>Automated Approval Pipelines</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Multi-stage review rules with human verification checkpoints.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 text-primary-400 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Proactive Delay-Risk Radar</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Explainable risk drivers with actionable corrective recommendations.
                  </p>
                </div>
              </div>

              {/* Notice Board Widget */}
              <div className="mt-8 rounded-xl border border-primary-900/40 bg-gradient-to-r from-primary-950/60 to-slate-900/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary-300">
                    <Bell className="w-3.5 h-3.5 text-primary-400" />
                    <span>Campus Notice & Accreditation Bulletin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Updated Today</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-start space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0"></span>
                    <span><strong>NAAC Cycle-3 Dossier:</strong> CSE and ECE criterion verifications currently undergoing final sign-off.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span><strong>Capstone Reviews:</strong> Faculty mentors may review submissions directly via the Approval Center.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer security badges */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                TLS 1.3 256-Bit Encrypted
              </span>
              <span>&bull;</span>
              <span>ISO 27001 Certified Infrastructure</span>
            </div>
            <span>Final Year Engineering Project &copy; 2026</span>
          </div>
        </div>

        {/* Right Column: Portal Login Card */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-20 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors">
          <div className="mx-auto w-full max-w-md">
            {/* Header info */}
            <div className="mb-6">
              <div className="lg:hidden flex items-center space-x-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white font-bold shadow">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  COLLEGE<span className="text-primary-600">FLOW</span>
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Institutional Portal Login
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Enter your authorized university credentials to access department workflows and tasks.
              </p>
            </div>

            {/* Navigation Tabs: Credentials vs Quick-Fill Demo */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'credentials'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-navy-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Sign In with Credentials
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'demo'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-navy-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-primary-500" />
                <span>One-Click Demo Roles</span>
              </button>
            </div>

            {/* Session Expired Notice */}
            {isExpired && (
              <div className="mb-4 flex items-center rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-amber-600" />
                Your security session has expired. Please sign in again.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'credentials' ? (
              /* Standard Credentials Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@college.edu"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-navy-900 dark:text-white transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Account Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotStep(1);
                        setForgotError('');
                        setForgotSuccess('');
                        setIsForgotModalOpen(true);
                      }}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline flex items-center"
                    >
                      <KeyRound className="w-3 h-3 mr-1" />
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-navy-900 dark:text-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-primary-600 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all uppercase tracking-wider"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Sign In to Institutional Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* One-Click Quick-Fill Demo Accounts Tab */
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select any institutional role below to instantly load demo credentials:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {demoAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDemoFill(acc.email, acc.role)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-primary-500 bg-white hover:bg-primary-50/40 text-left transition-all dark:border-slate-800 dark:bg-navy-900 dark:hover:border-primary-600 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.badge}`}>
                            {acc.role}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {acc.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {acc.email} &bull; <span className="italic">{acc.designation}</span>
                        </p>
                      </div>

                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 shrink-0">
                        Select &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Institutional Security Notice Footer */}
            <div className="mt-8 border-t border-slate-200/80 pt-6 text-[11px] text-slate-400 dark:border-slate-800 leading-relaxed text-center">
              <p>
                <strong>Security Notice:</strong> This computer system is the property of the University. Unauthorized access or misuse is prohibited and subject to institutional discipline and legal penalties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PROFESSIONAL FORGOT PASSWORD MODAL */}
      {/* ======================================================== */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-900 dark:border dark:border-slate-800">
            {/* Close button */}
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Account Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Self-service institutional credential recovery
                </p>
              </div>
            </div>

            {/* Status alerts */}
            {forgotError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && forgotStep !== 3 && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Enter your registered institutional email address. The system will verify your profile and dispatch a 6-digit security code.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. alex.faculty@college.edu"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-xs font-bold text-white hover:bg-primary-700 shadow disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Verifying...' : 'Request Verification PIN'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter Verification Code & New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Demo OTP Helper Box */}
                {generatedCode && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/60 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
                    <div className="font-bold flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Verification Code Generated:
                    </div>
                    <div className="text-lg font-mono font-black text-primary-600 mt-1 tracking-widest">
                      {generatedCode}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      (In production, this code is transmitted securely via SMTP. Displayed above for immediate testing.)
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    6-Digit Security Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    placeholder="Enter 6-digit PIN"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white text-center text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    &larr; Back to Email
                  </button>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success Confirmation */}
            {forgotStep === 3 && (
              <div className="text-center py-4 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Password Successfully Changed!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Your credentials have been updated in the campus database. Your login form has been populated with your new credentials.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-primary-600 text-xs font-bold text-white hover:bg-primary-700 shadow"
                  >
                    Return & Sign In Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
