import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, AlertCircle, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle, Zap, Shield, Brain } from 'lucide-react';

const Register = () => {
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPw] = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [gLoading, setGLoading]         = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const pwStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)            s++;
    if (password.length >= 10)           s++;
    if (/[A-Z]/.test(password))          s++;
    if (/[0-9]/.test(password))          s++;
    if (/[^A-Za-z0-9]/.test(password))   s++;
    return s;
  };
  const strength = pwStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:24px_24px]" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm shadow-2xl mb-8 animate-float">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            Start Your Journey<br />
            <span className="text-emerald-200">to Success</span>
          </h1>
          <p className="text-white/80 mb-10 max-w-sm mx-auto leading-relaxed">
            Join thousands of job seekers who improved their resumes and landed their dream jobs.
          </p>
          <div className="space-y-3 text-left">
            {[
              { icon: Zap,    text: 'AI-powered ATS score analysis in 2-3 seconds' },
              { icon: Brain,  text: 'Personalized self-introduction generator' },
              { icon: Shield, text: 'Role-specific mock interview questions' },
              { icon: CheckCircle, text: '38+ IT roles — Blockchain, Cloud, Security & more' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/25 transition-all duration-300">
                <Icon className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                <span className="text-sm text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up py-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              AI Resume Analyzer
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create account ✨</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Free forever. No credit card required.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-400 animate-fade-in">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* ── Google Sign-Up — custom styled ── */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => document.getElementById('google-register-trigger')?.click()}
                disabled={gLoading}
                className="w-full flex items-center justify-center space-x-3 py-3.5 px-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-gray-700 dark:text-gray-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {gLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span className="text-sm">{gLoading ? 'Signing up with Google…' : 'Sign up with Google'}</span>
                {!gLoading && <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors">→</span>}
              </button>
              <div className="hidden">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setGLoading(true); setError('');
                    try { await googleLogin(credentialResponse.credential); navigate('/'); }
                    catch (err) { setError(err.response?.data?.message || 'Google sign-up failed. Please try again.'); }
                    finally { setGLoading(false); }
                  }}
                  onError={() => setError('Google sign-up failed. Please try again.')}
                  useOneTap={false} theme="outline" size="large" width="368" text="signup_with_google" shape="rectangular"
                  containerProps={{ id: 'google-register-trigger' }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                or sign up with email
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none hover:border-emerald-300 dark:hover:border-emerald-700"
                    placeholder="John Doe" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none hover:border-emerald-300 dark:hover:border-emerald-700"
                    placeholder="you@example.com" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none hover:border-emerald-300 dark:hover:border-emerald-700"
                    placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors">
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex space-x-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPw(e.target.value)} required
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none ${
                      confirmPassword && confirmPassword !== password ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                    placeholder="••••••••" />
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] mt-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Create Account</span><ArrowRight className="h-5 w-5" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
