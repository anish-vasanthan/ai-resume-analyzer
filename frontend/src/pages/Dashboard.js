import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumes, getStats, deleteResume } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText, TrendingUp, Award, Target, Eye,
  Calendar, Upload, ArrowRight, Sparkles, Zap, Brain, Trash2, Code
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className={`card-hover bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-card animate-slide-up`}
    style={{ animationDelay: delay }}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
        Active
      </span>
    </div>
    <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

const ScoreGauge = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-gray-700" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-900 dark:text-white">{score}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-green-600">{payload[0].value} resume{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [resumes, setResumes]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [r, s] = await Promise.all([getResumes(), getStats()]);
      setResumes(r.data);
      setStats(s.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, resumeId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    setDeletingId(resumeId);
    try {
      await deleteResume(resumeId);
      setResumes(prev => prev.filter(r => (r._id || r.id) !== resumeId));
      // Refresh stats
      const s = await getStats();
      setStats(s.data);
    } catch (err) {
      alert('Failed to delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-green-500/30">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  const roleData = stats?.roleDistribution
    ? Object.entries(stats.roleDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">
                {greeting()}, {user?.name?.split(' ')[0]} 👋
              </p>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Your Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Track your resume performance and interview readiness</p>
            </div>
            <Link to="/upload"
              className="hidden sm:flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300">
              <Upload className="h-4 w-4" />
              <span>Upload Resume</span>
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
          <StatCard icon={FileText}   label="Total Resumes"   value={stats?.totalResumes || 0}                                    color="bg-gradient-to-br from-green-500 to-emerald-600"  delay="0.05s" />
          <StatCard icon={TrendingUp} label="Avg ATS Score"   value={stats?.averageAtsScore || 0}                                 color="bg-gradient-to-br from-emerald-500 to-teal-600"   delay="0.10s" />
          <StatCard icon={Award}      label="Skills Detected" value={stats?.topSkills?.length || 0}                               color="bg-gradient-to-br from-teal-500 to-cyan-600"      delay="0.15s" />
          <StatCard icon={Target}     label="Target Roles"    value={Object.keys(stats?.roleDistribution || {}).length}           color="bg-gradient-to-br from-cyan-500 to-blue-600"      delay="0.20s" />
        </div>

        {/* Charts row */}
        {stats && stats.totalResumes > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* ATS gauge */}
            <div className="card-hover bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-card flex flex-col items-center justify-center animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center space-x-2 mb-4 self-start">
                <Zap className="h-5 w-5 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Average ATS Score</h3>
              </div>
              <ScoreGauge score={stats.averageAtsScore || 0} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                Based on {stats.totalResumes} resume{stats.totalResumes !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Role distribution */}
            <div className="card-hover bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-card animate-slide-up" style={{ animationDelay: '0.30s' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Role Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    paddingAngle={3} dataKey="value">
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top skills */}
            <div className="card-hover bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-card animate-slide-up" style={{ animationDelay: '0.35s' }}>
              <div className="flex items-center space-x-2 mb-5">
                <Code className="h-5 w-5 text-teal-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Top Skills</h3>
              </div>
              {(stats.topSkills?.slice(0, 5) || []).length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No skills detected yet</div>
              ) : (
                <div className="space-y-3">
                  {stats.topSkills.slice(0, 5).map((item, i) => {
                    const max = stats.topSkills[0]?.count || 1;
                    const pct = Math.round((item.count / max) * 100);
                    const barColors = [
                      { bar: 'from-green-500 to-emerald-500',  badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                      { bar: 'from-emerald-500 to-teal-500',   badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
                      { bar: 'from-teal-500 to-cyan-500',      badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
                      { bar: 'from-cyan-500 to-blue-500',      badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
                      { bar: 'from-blue-500 to-indigo-500',    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                    ];
                    const c = barColors[i] || barColors[0];
                    return (
                      <div key={item.skill || i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                              #{i + 1}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[110px]">
                              {item.skill}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {item.count} resume{item.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%`, transitionDelay: `${i * 100}ms` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Resumes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card animate-slide-up" style={{ animationDelay: '0.40s' }}>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Recent Resumes</h3>
            </div>
            <Link to="/upload"
              className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline flex items-center space-x-1">
              <span>Upload New</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {resumes.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-10 w-10 text-green-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No resumes yet</h4>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Upload your first resume to get AI-powered analysis</p>
              <Link to="/upload"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all">
                <Upload className="h-4 w-4" />
                <span>Upload Resume</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {resumes.map((resume, i) => {
                const score = resume.analysis?.atsScore || resume.atsScore || 0;
                const scoreColor = score >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                  : score >= 60 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-red-600 bg-red-50 dark:bg-red-900/20';
                return (
                  <div key={resume._id || resume.id}
                    className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group animate-slide-up"
                    style={{ animationDelay: `${0.45 + i * 0.05}s` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {resume.fileName}
                          </h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                            </span>
                            {resume.detectedRole && (
                              <span className="tag bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                {resume.detectedRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`tag font-bold ${scoreColor}`}>
                          ATS {score}
                        </span>
                        <Link to={`/resume/${resume._id || resume.id}`}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 transition-all opacity-0 group-hover:opacity-100">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                        <button
                          onClick={(e) => handleDelete(e, resume._id || resume.id)}
                          disabled={deletingId === (resume._id || resume.id)}
                          className="flex items-center justify-center w-9 h-9 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Delete resume"
                        >
                          {deletingId === (resume._id || resume.id)
                            ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
