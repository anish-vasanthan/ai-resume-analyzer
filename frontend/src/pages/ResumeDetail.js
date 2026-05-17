import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getResume, deleteResume, regenerateIntroduction } from '../services/api';
import {
  TrendingUp, AlertTriangle, CheckCircle, Briefcase,
  GraduationCap, Code, MessageSquare, Trash2,
  RefreshCw, ArrowLeft, Copy, Check, Sparkles, Zap,
  ChevronDown, ChevronUp, Mail, Wand2
} from 'lucide-react';

const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-sm text-white/70">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-lg font-bold text-white">{label}</span>
    </div>
  );
};

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [regenerating, setRegen]    = useState(false);
  const [copied, setCopied]         = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadResume(); }, [id]);

  const loadResume = async () => {
    try {
      const r = await getResume(id);
      setResume(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this resume?')) return;
    await deleteResume(id);
    navigate('/');
  };

  const handleRegen = async () => {
    setRegen(true);
    try {
      const r = await regenerateIntroduction(id);
      setResume({ ...resume, selfIntroduction: r.data.selfIntroduction });
    } finally { setRegen(false); }
  };

  const copyIntro = () => {
    navigator.clipboard.writeText(resume.selfIntroduction);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-green-500/30">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  if (!resume) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Resume not found</p>
    </div>
  );

  const score = resume.analysis?.atsScore || 0;
  const scoreGradient = score >= 80 ? 'from-green-500 via-emerald-500 to-teal-600'
    : score >= 60 ? 'from-yellow-500 via-orange-500 to-amber-600'
    : 'from-red-500 via-rose-500 to-pink-600';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <button onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <div className="flex items-center space-x-2">
            <Link to={`/resume/${resume._id || resume.id}/enhance?jd=1`}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all text-sm">
              <Wand2 className="h-4 w-4" />
              <span>Enhance with JD</span>
            </Link>
            <Link to={`/resume/${resume._id || resume.id}/enhance`}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all text-sm">
              <Wand2 className="h-4 w-4" />
              <span>Enhance Resume</span>
            </Link>
            <Link to={`/interview/${resume._id || resume.id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all text-sm">
              <Zap className="h-4 w-4" />
              <span>Interview Questions</span>
            </Link>
            <button onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ATS Hero Banner */}
        <div className={`bg-gradient-to-r ${scoreGradient} rounded-3xl p-8 mb-8 animate-slide-up relative overflow-hidden`}
          style={{ animationDelay: '0.05s' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <p className="text-white/70 text-sm font-medium mb-1">Resume Analysis</p>
              <h2 className="text-3xl font-black mb-2">{resume.fileName}</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {resume.detectedRole && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {resume.detectedRole}
                  </span>
                )}
                {resume.parsedData?.name && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {resume.parsedData.name}
                  </span>
                )}
                {resume.parsedData?.email && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{resume.parsedData.email}</span>
                  </span>
                )}
              </div>
            </div>
            <ScoreRing score={score} />
          </div>
        </div>

        {/* ATS progress bars */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.10s' }}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <span>Score Breakdown</span>
          </h3>
          {resume.analysis?.scoreBreakdown ? (
            <div className="space-y-4">
              {[
                { label: 'Keyword Match',        value: resume.analysis.scoreBreakdown.keywordMatch,        desc: 'How well your skills match the detected role' },
                { label: 'Format Compliance',    value: resume.analysis.scoreBreakdown.formatCompliance,    desc: 'Formatting consistency and ATS readability' },
                { label: 'Content Quality',      value: resume.analysis.scoreBreakdown.contentQuality,      desc: 'Action verbs, specificity, and impact statements' },
                { label: 'Section Completeness', value: resume.analysis.scoreBreakdown.sectionCompleteness, desc: 'Presence of all standard resume sections' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 hidden sm:inline">{item.desc}</span>
                    </div>
                    <span className={`font-bold ${item.value >= 70 ? 'text-green-600 dark:text-green-400' : item.value >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden progress-bar">
                    <div className={`h-full rounded-full transition-all duration-1000 ${item.value >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : item.value >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                      style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Keyword Match',        value: Math.min(100, score + 5) },
                { label: 'Format Compliance',    value: Math.min(100, score - 5) },
                { label: 'Content Quality',      value: Math.min(100, score + 2) },
                { label: 'Section Completeness', value: Math.min(100, score - 3) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden progress-bar">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
                Re-analyze this resume to get precise breakdown scores.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <Section title="Strengths" icon={CheckCircle} defaultOpen={true}>
            <div className="space-y-2">
              {(resume.analysis?.strengths || []).map((s, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Weaknesses */}
          <Section title="Areas to Improve" icon={AlertTriangle} defaultOpen={true}>
            <div className="space-y-2">
              {(resume.analysis?.weaknesses || []).map((w, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{w}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Suggestions */}
        <Section title="Improvement Suggestions" icon={TrendingUp}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(resume.analysis?.suggestions || []).map((s, i) => (
              <div key={i} className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Missing Keywords */}
        {(resume.analysis?.missingKeywords || []).length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6 mt-6 animate-slide-up">
            <div className="flex items-center space-x-2 mb-4">
              <Code className="h-5 w-5 text-teal-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Missing Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.analysis.missingKeywords.map((kw, i) => (
                <span key={i} className="tag bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  + {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Self Introduction */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-2xl p-6 mt-6 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Self-Introduction</h3>
                  <p className="text-white/60 text-xs">Ready to use in interviews</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={copyIntro}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button onClick={handleRegen} disabled={regenerating}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>{regenerating ? 'Generating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            {/* Introduction text — paragraph-aware rendering */}
            <div className="bg-white/10 rounded-2xl p-5 space-y-3">
              {(resume.selfIntroduction || 'No introduction generated yet.')
                .split(/\n+/)
                .filter(p => p.trim())
                .map((para, i) => (
                  <p key={i} className="text-white/90 leading-relaxed text-sm">
                    {para.trim()}
                  </p>
                ))}
            </div>

            {/* Word count */}
            <div className="mt-3 flex items-center justify-between text-white/50 text-xs">
              <span>
                {(resume.selfIntroduction || '').trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <span>Powered by Groq AI</span>
            </div>
          </div>
        </div>

        {/* Skills + Education + Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {(resume.parsedData?.skills || []).length > 0 && (
            <Section title="Skills" icon={Code} defaultOpen={true}>
              <div className="flex flex-wrap gap-2">
                {resume.parsedData.skills.map((s, i) => (
                  <span key={i} className="tag bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {(resume.parsedData?.education || []).length > 0 && (
            <Section title="Education" icon={GraduationCap} defaultOpen={true}>
              <div className="space-y-3">
                {resume.parsedData.education.map((e, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{e.degree}</p>
                    {e.year && <p className="text-xs text-gray-500 mt-0.5">{e.year}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(resume.parsedData?.experience || []).length > 0 && (
            <Section title="Experience" icon={Briefcase} defaultOpen={true}>
              <div className="space-y-3">
                {resume.parsedData.experience.map((e, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{e.title}</p>
                    {e.duration && <p className="text-xs text-gray-500 mt-0.5">{e.duration}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
