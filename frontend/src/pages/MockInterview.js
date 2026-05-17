import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResumes, getMockInterviews, startMockInterview, deleteMockInterview } from '../services/api';
import {
  Play, Clock, Award, Eye, Calendar, Brain, Sparkles,
  ChevronRight, CheckCircle, Loader, Trash2
} from 'lucide-react';

const roles = [
  // Development Roles
  { name: 'Full Stack Developer',          emoji: '💻', color: 'from-emerald-500 to-teal-500',    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]' },
  { name: 'Frontend Developer',            emoji: '🎨', color: 'from-pink-500 to-rose-500',       glow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]' },
  { name: 'Backend Developer',             emoji: '⚙️', color: 'from-slate-600 to-gray-700',      glow: 'hover:shadow-[0_0_20px_rgba(71,85,105,0.5)]' },
  { name: 'Mobile App Developer',          emoji: '📱', color: 'from-blue-500 to-indigo-500',     glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { name: 'Java Developer',                emoji: '☕', color: 'from-orange-500 to-red-500',      glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
  { name: 'Python Developer',              emoji: '🐍', color: 'from-yellow-500 to-green-500',    glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]' },
  { name: 'React Developer',               emoji: '⚛️', color: 'from-cyan-400 to-blue-500',       glow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]' },
  { name: 'Node.js Developer',             emoji: '🟢', color: 'from-green-600 to-emerald-600',   glow: 'hover:shadow-[0_0_20px_rgba(22,163,74,0.5)]' },
  // Data & AI
  { name: 'Data Analyst',                  emoji: '📊', color: 'from-blue-500 to-cyan-500',       glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { name: 'Data Scientist',                emoji: '🔬', color: 'from-purple-500 to-pink-500',     glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]' },
  { name: 'Machine Learning Engineer',     emoji: '🤖', color: 'from-violet-500 to-purple-600',   glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]' },
  { name: 'AI Engineer',                   emoji: '🧠', color: 'from-indigo-500 to-purple-500',   glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]' },
  { name: 'Data Engineer',                 emoji: '🗄️', color: 'from-slate-600 to-gray-700',      glow: 'hover:shadow-[0_0_20px_rgba(71,85,105,0.5)]' },
  { name: 'Business Intelligence Analyst', emoji: '📈', color: 'from-blue-600 to-indigo-600',     glow: 'hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]' },
  // Cloud & Infrastructure
  { name: 'Cloud Engineer',                emoji: '☁️', color: 'from-sky-400 to-blue-500',        glow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]' },
  { name: 'Cloud Architect',               emoji: '🏗️', color: 'from-blue-600 to-indigo-700',     glow: 'hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]' },
  { name: 'AWS Engineer',                  emoji: '🟠', color: 'from-orange-500 to-amber-600',    glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
  { name: 'Azure Engineer',                emoji: '🔵', color: 'from-blue-500 to-blue-700',       glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { name: 'DevOps Engineer',               emoji: '🚀', color: 'from-emerald-500 to-green-600',   glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]' },
  { name: 'Site Reliability Engineer',     emoji: '🛡️', color: 'from-teal-600 to-cyan-700',       glow: 'hover:shadow-[0_0_20px_rgba(13,148,136,0.5)]' },
  // Security
  { name: 'Cybersecurity Analyst',         emoji: '🔒', color: 'from-red-600 to-rose-700',        glow: 'hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]' },
  { name: 'Security Engineer',             emoji: '🛡️', color: 'from-rose-600 to-red-700',        glow: 'hover:shadow-[0_0_20px_rgba(225,29,72,0.5)]' },
  { name: 'Penetration Tester',            emoji: '🎯', color: 'from-red-500 to-orange-600',      glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]' },
  { name: 'Security Architect',            emoji: '🔐', color: 'from-gray-700 to-slate-800',      glow: 'hover:shadow-[0_0_20px_rgba(55,65,81,0.5)]' },
  { name: 'SOC Analyst',                   emoji: '👁️', color: 'from-indigo-600 to-purple-700',   glow: 'hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]' },
  // Blockchain & Web3
  { name: 'Blockchain Developer',          emoji: '⛓️', color: 'from-amber-500 to-yellow-600',    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]' },
  { name: 'Smart Contract Developer',      emoji: '📜', color: 'from-yellow-600 to-orange-600',   glow: 'hover:shadow-[0_0_20px_rgba(202,138,4,0.5)]' },
  { name: 'Web3 Developer',                emoji: '🌐', color: 'from-purple-600 to-pink-600',     glow: 'hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]' },
  { name: 'Solidity Developer',            emoji: '💎', color: 'from-indigo-600 to-blue-700',     glow: 'hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]' },
  // Specialized
  { name: 'QA Engineer',                   emoji: '🧪', color: 'from-green-500 to-emerald-600',   glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]' },
  { name: 'Database Administrator',        emoji: '💾', color: 'from-slate-600 to-gray-700',      glow: 'hover:shadow-[0_0_20px_rgba(71,85,105,0.5)]' },
  { name: 'System Administrator',          emoji: '🖥️', color: 'from-gray-600 to-slate-700',      glow: 'hover:shadow-[0_0_20px_rgba(75,85,99,0.5)]' },
  { name: 'Network Engineer',              emoji: '🌐', color: 'from-cyan-600 to-teal-700',       glow: 'hover:shadow-[0_0_20px_rgba(8,145,178,0.5)]' },
  { name: 'UI/UX Designer',               emoji: '🎨', color: 'from-pink-500 to-rose-600',       glow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]' },
  { name: 'Product Manager',               emoji: '📋', color: 'from-violet-500 to-purple-600',   glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]' },
  { name: 'Scrum Master',                  emoji: '🏃', color: 'from-blue-500 to-indigo-600',     glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { name: 'IT Support Specialist',         emoji: '🆘', color: 'from-teal-500 to-cyan-600',       glow: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]' },
];

export default function MockInterview() {
  const navigate = useNavigate();
  const [resumes, setResumes]               = useState([]);
  const [mockInterviews, setMockInterviews] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedRole, setSelectedRole]     = useState('');
  const [loading, setLoading]               = useState(true);
  const [starting, setStarting]             = useState(false);
  const [deletingId, setDeletingId]         = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [r, m] = await Promise.all([getResumes(), getMockInterviews()]);
      setResumes(r.data);
      setMockInterviews(m.data);
      if (r.data.length > 0) {
        setSelectedResume(r.data[0]._id || r.data[0].id);
        setSelectedRole(r.data[0].detectedRole || '');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStart = async () => {
    if (!selectedRole) { alert('Please select a role'); return; }
    setStarting(true);
    try {
      const r = await startMockInterview(selectedResume || null, selectedRole);
      navigate(`/mock-interview/${r.data._id || r.data.id}`);
    } catch (e) {
      alert('Failed to start. Please try again.');
      setStarting(false);
    }
  };

  const handleDelete = async (e, interviewId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this interview? This cannot be undone.')) return;
    setDeletingId(interviewId);
    try {
      await deleteMockInterview(interviewId);
      setMockInterviews(prev => prev.filter(i => (i._id || i.id) !== interviewId));
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-green-500/30">
        <Brain className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="mb-8 animate-slide-up">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full border border-green-200 dark:border-green-800 mb-4">
            <Brain className="h-4 w-4 text-green-600 dark:text-green-400 animate-float" />
            <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              AI-Powered Mock Interviews
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mock Interview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Practice with AI and get instant feedback on your answers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

          {/* ── Setup card ── */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <span>Start New Interview</span>
            </h2>

            {/* Resume selector */}
            {resumes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Resume
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Questions will be tailored to your resume's skills, experience, and projects
                </p>
                <select value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white outline-none transition-all hover:border-green-300 dark:hover:border-green-700">
                  <option value="">No resume (generic questions)</option>
                  {resumes.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.fileName} — {r.detectedRole}
                    </option>
                  ))}
                </select>
                {selectedResume && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Questions will be customized based on your resume's skills, projects, and experience
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Role grid */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Your Role
                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-bold">
                  {roles.length} IT Roles
                </span>
              </label>
              <div className="max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role, index) => (
                    <button key={role.name} onClick={() => setSelectedRole(role.name)}
                      className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all duration-300 text-left transform ${
                        selectedRole === role.name
                          ? `border-transparent bg-gradient-to-r ${role.color} text-white scale-105 shadow-lg ${role.glow}`
                          : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-transparent hover:bg-gradient-to-r ${role.color} hover:text-white hover:scale-105 ${role.glow}`
                      }`}
                      style={{ animationDelay: `${index * 0.02}s` }}>
                      <span className="text-lg flex-shrink-0">{role.emoji}</span>
                      <span className="text-xs font-semibold flex-1 truncate">{role.name}</span>
                      {selectedRole === role.name && (
                        <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start button */}
            <button onClick={handleStart} disabled={starting || !selectedRole}
              className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg relative overflow-hidden group ${
                selectedRole
                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}>
              {selectedRole && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
              {starting
                ? <><Loader className="h-5 w-5 animate-spin" /><span>Generating Questions...</span></>
                : <><Play className="h-5 w-5 group-hover:scale-110 transition-transform" /><span>Start Mock Interview</span></>}
            </button>
          </div>

          {/* ── Info panel ── */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <h3 className="font-bold text-lg mb-4 relative z-10">What to expect</h3>
              <div className="space-y-3 relative z-10">
                {[
                  { icon: '🎯', text: '4 Technical questions on your core skills' },
                  { icon: '⚡', text: '3 Scenario questions based on your skills' },
                  { icon: '💡', text: '3 Real-world concept questions from your skills' },
                  { icon: '🔨', text: '3 Technical questions on your projects' },
                  { icon: '🚀', text: '3 Real-time scenario questions on your projects' },
                  { icon: '🤝', text: '4 HR questions (skill & project focused)' },
                  { icon: '📊', text: '20 questions total with instant feedback & score' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-white/90">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <span className="text-xl">💡</span>
                <span>Tips for success</span>
              </h3>
              <div className="space-y-2">
                {[
                  { text: 'Use the STAR method for behavioral questions', color: 'bg-green-500' },
                  { text: 'Be specific with examples and numbers',         color: 'bg-emerald-500' },
                  { text: 'Keep answers between 100–200 words',            color: 'bg-teal-500' },
                  { text: 'Show enthusiasm and confidence',                color: 'bg-cyan-500' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${tip.color} mt-2 flex-shrink-0`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Previous Interviews ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span>Previous Interviews</span>
            </h2>
            {mockInterviews.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                {mockInterviews.length} total
              </span>
            )}
          </div>

          {mockInterviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No interviews yet. Start your first one above!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {mockInterviews.map((interview) => {
                const role     = roles.find(r => r.name === interview.role);
                const answered = interview.questions?.filter(q => q.userAnswer).length || 0;
                const total    = interview.questions?.length || 0;
                const iid      = interview._id || interview.id;
                const isDeleting = deletingId === iid;

                return (
                  <div key={iid}
                    className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                    <div className="flex items-center justify-between">
                      {/* Left: role icon + info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role?.color || 'from-green-500 to-emerald-600'} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                          {role?.emoji || '💼'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{interview.role}</h4>
                            <span className={`tag text-xs flex-shrink-0 ${
                              interview.status === 'completed'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {interview.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 flex-wrap gap-y-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                            </span>
                            <span>{answered}/{total} answered</span>
                            {interview.status === 'completed' && (
                              <span className="flex items-center space-x-1 text-green-600 dark:text-green-400 font-bold">
                                <Award className="h-3 w-3" />
                                <span>{interview.overallScore}/100</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: action buttons */}
                      <div className="flex items-center space-x-2 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {/* View button */}
                        <button onClick={() => navigate(`/mock-interview/${iid}`)}
                          className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 transition-all hover:scale-105">
                          <Eye className="h-4 w-4" />
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, iid)}
                          disabled={isDeleting}
                          className="flex items-center justify-center w-9 h-9 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all hover:scale-105 disabled:opacity-50"
                          title="Delete interview">
                          {isDeleting
                            ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Score progress bar */}
                    {interview.status === 'completed' && (
                      <div className="mt-3 ml-16">
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                            style={{ width: `${interview.overallScore}%` }} />
                        </div>
                      </div>
                    )}
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
