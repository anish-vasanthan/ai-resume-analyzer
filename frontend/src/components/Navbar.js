import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Moon, Sun, Menu, X, LogOut, Upload, Home,
  MessageSquare, Sparkles, Target, User, Settings, ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, serverWaking } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = [
    { to: '/dashboard',    icon: Home,          label: 'Dashboard' },
    { to: '/upload',       icon: Upload,        label: 'Upload Resume' },
    { to: '/job-matcher',  icon: Target,        label: 'Job Matcher' },
    { to: '/mock-interview', icon: MessageSquare, label: 'Mock Interview' },
  ];

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname === '/'
      : location.pathname.startsWith(path);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-300 dark:border-green-900/30'
        : 'bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800'
    }`}>
      {/* Server wake-up banner */}
      {serverWaking && (
        <div className="bg-amber-500 text-white text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center space-x-2">
          <svg className="animate-spin h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span>Server is waking up — this takes ~30 seconds. Please wait before uploading.</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-green-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">AI Resume</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-200"> Analyzer</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-800/50'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-green-900/20 hover:text-gray-900 dark:hover:text-green-400'
                }`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {isActive(to) && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-2">
            {/* theme toggle */}
            <button onClick={toggleTheme}
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-green-900/20 hover:text-gray-900 dark:hover:text-green-400 transition-all duration-200 hover:scale-110">
              {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-green-900/20 border border-gray-300 dark:border-green-900/30 hover:border-green-400 dark:hover:border-green-700 transition-all duration-200 group"
              >
                {/* avatar or initials */}
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar"
                    className="w-7 h-7 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-black">{initials}</span>
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* dropdown menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden animate-slide-up z-50">
                  {/* user info header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <span className="text-white text-sm font-black">{initials}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* menu items */}
                  <div className="py-1">
                    <Link to="/profile" onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                      <Settings className="h-4 w-4" /><span>Profile Settings</span>
                    </Link>
                    <Link to="/dashboard" onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                      <User className="h-4 w-4" /><span>My Dashboard</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                    <button onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                      className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut className="h-4 w-4" /><span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button onClick={toggleTheme} className="p-2 rounded-xl text-gray-600 dark:text-gray-400">
              {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-green-900/20">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1 animate-slide-up">
          {/* mobile user info */}
          <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-sm font-black">{initials}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} onClick={() => setIsMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive(to)
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-green-900/20'
              }`}>
              <Icon className="h-4 w-4" /><span>{label}</span>
            </Link>
          ))}

          <Link to="/profile" onClick={() => setIsMenuOpen(false)}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-green-900/20 transition-all">
            <Settings className="h-4 w-4" /><span>Profile Settings</span>
          </Link>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <button onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut className="h-4 w-4" /><span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
