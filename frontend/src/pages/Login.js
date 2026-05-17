import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import {
  Mail, Lock, AlertCircle, Sparkles, ArrowRight,
  Eye, EyeOff, Zap, Shield, Star, ChevronDown, User
} from 'lucide-react';

/* ── Google "G" SVG icon ── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ── Email suggestion dropdown ── */
function EmailSuggestions({ value, suggestions, onSelect, visible }) {
  if (!visible || suggestions.length === 0) return null;
  const filtered = suggestions.filter(e =>
    e.toLowerCase().includes(value.toLowerCase()) && e !== value
  );
  if (filtered.length === 0) return null;

  return (
    <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
      {filtered.map((email) => (
        <li key={email}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(email); }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-gray-700 dark:text-gray-200 font-medium truncate">{email}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { login, googleLogin, getKnownEmails } = useAuth();
  const navigate         = useNavigate();
  const emailRef         = useRef(null);
  const googleBtnRef     = useRef(null);
  const knownEmails      = getKnownEmails();

  /* close suggestions when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (emailRef.current && !emailRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── email/password login ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google login ── */
  /* handled inline by GoogleLogin component below */

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:24px_24px]" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm shadow-2xl mb-8 animate-float">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            AI Resume<br />
            <span className="text-green-200">Analyzer</span>
          </h1>
          <p className="text-lg text-white/80 max-w-sm mx-auto leading-relaxed mb-10">
            Supercharge your job search with AI-powered resume analysis and interview preparation.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Resumes Analyzed', value: '10K+', icon: '📄' },
              { label: 'Interview Questions', value: '500+', icon: '🎯' },
              { label: 'Success Rate',        value: '94%',  icon: '⭐' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/25 transition-all duration-300 hover:scale-105">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: Zap,    text: 'Ultra-fast Groq AI — 2-3 second analysis' },
              { icon: Shield, text: 'Secure & private — your data is safe' },
              { icon: Star,   text: '38+ IT roles for mock interviews' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-3">
                <Icon className="h-5 w-5 text-green-300 flex-shrink-0" />
                <span className="text-sm text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              AI Resume Analyzer
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Welcome back 👋</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to continue your journey</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-400 animate-fade-in">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* ── Google Sign-In — custom styled button ── */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => {
                  // trigger the hidden GoogleLogin
                  googleBtnRef.current?.querySelector('div[role="button"]')?.click()
                    || googleBtnRef.current?.querySelector('button')?.click();
                }}
                disabled={gLoading}
                className="w-full flex items-center justify-center space-x-3 py-3.5 px-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-gray-700 dark:text-gray-200 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {gLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="text-sm">{gLoading ? 'Signing in with Google…' : 'Continue with Google'}</span>
                {!gLoading && (
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 group-hover:text-green-500 transition-colors">→</span>
                )}
              </button>

              {/* Hidden real GoogleLogin — triggered by the button above */}
              <div className="hidden" ref={googleBtnRef}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setGLoading(true);
                    setError('');
                    try {
                      await googleLogin(credentialResponse.credential);
                      navigate('/');
                    } catch (err) {
                      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
                    } finally {
                      setGLoading(false);
                    }
                  }}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  width="368"
                  text="signin_with_google"
                  shape="rectangular"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                or sign in with email
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* ── Email / Password form ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email with suggestion dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative" ref={emailRef}>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-10 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all outline-none hover:border-green-300 dark:hover:border-green-700"
                    placeholder="you@example.com"
                  />
                  {/* Dropdown chevron — only show when there are suggestions */}
                  {knownEmails.length > 0 && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowSuggestions(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  <EmailSuggestions
                    value={email}
                    suggestions={knownEmails}
                    visible={showSuggestions}
                    onSelect={(e) => { setEmail(e); setShowSuggestions(false); }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all outline-none hover:border-green-300 dark:hover:border-green-700"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="h-5 w-5" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-green-600 dark:text-green-400 hover:underline">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
