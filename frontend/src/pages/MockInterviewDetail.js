import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Award, Loader, Brain,
  Trophy, ChevronLeft, ChevronRight, Sparkles, Clock,
  Target, BarChart2, Zap, Star
} from 'lucide-react';
import { getMockInterview, submitAnswer, completeMockInterview } from '../services/api';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
// isCorrect is stored as 1/0 (MySQL JSON integer) — treat both 1 and true as correct
const isQ = (v) => v === 1 || v === true;

const optionLetters = ['A', 'B', 'C', 'D'];

const typeConfig = {
  // new 7-category types
  skill_technical: {
    label: 'Skill — Technical',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Icon: Zap,
  },
  skill_scenario: {
    label: 'Skill — Scenario',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Icon: Target,
  },
  skill_concept: {
    label: 'Skill — Concept',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Icon: Zap,
  },
  project_technical: {
    label: 'Project — Technical',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    Icon: Zap,
  },
  project_scenario: {
    label: 'Project — Scenario',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Icon: Target,
  },
  hr_skill: {
    label: 'HR — Skill',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Icon: Star,
  },
  hr_project: {
    label: 'HR — Project',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Icon: Star,
  },
  // legacy fallbacks
  technical: {
    label: 'Technical',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Icon: Zap,
  },
  hr: {
    label: 'HR',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Icon: Star,
  },
  scenario: {
    label: 'Scenario',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Icon: Target,
  },
};

/* ─── confetti colours ────────────────────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6',
];

function makeParticles() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dx: (Math.random() - 0.5) * 160,
    dy: -(Math.random() * 120 + 40),
    rotate: Math.random() * 720 - 360,
    size: Math.random() * 8 + 6,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));
}

/* ─── animated score ring ─────────────────────────────────────────────────── */
function ScoreRing({ score, size = 180, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - (score / 100) * circ);
    }, 300);
    return () => clearTimeout(t);
  }, [score, circ]);

  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#6366f1' :
    score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900 dark:text-white">{score}</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Score</span>
      </div>
    </div>
  );
}

/* ─── progress ring (question progress) ──────────────────────────────────── */
function ProgressRing({ current, total, size = 64, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? current / total : 0;
  const offset = circ - pct * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={stroke}
          className="text-gray-200 dark:text-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#prog-grad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        <defs>
          <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{current}</span>
        <span className="text-[9px] text-gray-400 leading-none">/{total}</span>
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function MockInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* state */
  const [interview, setInterview]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [view, setView]                     = useState('quiz'); // 'quiz' | 'results'

  const [currentIndex, setCurrentIndex]     = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [answerResult, setAnswerResult]     = useState(null); // { isCorrect, feedback, correctAnswer }

  const [completing, setCompleting]         = useState(false);
  const [confetti, setConfetti]             = useState([]);   // particles
  const [shakeLetter, setShakeLetter]       = useState(null); // option letter to shake

  /* ── load ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await getMockInterview(id);
        const data = res.data;
        setInterview(data);
        if (data.status === 'completed') {
          setView('results');
        } else {
          // resume at first unanswered question
          const firstUnanswered = data.questions.findIndex(q => !q.userAnswer);
          setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
      } catch (e) {
        setError('Failed to load interview. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ── score count-up on results ── */
  useEffect(() => {
    if (view !== 'results' || !interview) return;
    const target = interview.overallScore || 0;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      if (current >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [view, interview]);

  /* ── derived ── */
  const questions = interview?.questions || [];
  const currentQ  = questions[currentIndex] || null;
  const answered  = questions.filter(q => q.userAnswer && q.userAnswer !== '');
  const correct   = answered.filter(q => isQ(q.isCorrect));
  const liveScore = answered.length > 0 ? Math.round((correct.length / answered.length) * 100) : 0;
  const allAnswered = answered.length === questions.length && questions.length > 0;

  /* ── reset per-question UI when navigating ── */
  useEffect(() => {
    setSelectedOption(null);
    setAnswerResult(null);
    setShakeLetter(null);
    setConfetti([]);
  }, [currentIndex]);

  /* ── select option ── */
  const handleSelectOption = useCallback((letter) => {
    if (!currentQ) return;
    if (currentQ.userAnswer) return; // already answered
    if (answerResult) return;        // just submitted
    setSelectedOption(letter);
  }, [currentQ, answerResult]);

  /* ── submit answer ── */
  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedOption || submitting || !currentQ || currentQ.userAnswer) return;
    setSubmitting(true);
    try {
      const res = await submitAnswer(id, currentIndex, selectedOption);
      const ev  = res.data.evaluation;

      // patch local state
      setInterview(prev => {
        const qs = prev.questions.map((q, i) =>
          i === currentIndex
            ? { ...q, userAnswer: selectedOption, isCorrect: ev.isCorrect ? 1 : 0, feedback: ev.feedback }
            : q
        );
        return { ...prev, questions: qs };
      });

      setAnswerResult({
        isCorrect:     ev.isCorrect,
        feedback:      ev.feedback,
        correctAnswer: ev.correctAnswer,
      });

      if (ev.isCorrect) {
        // confetti burst
        setConfetti(makeParticles());
        setTimeout(() => setConfetti([]), 1400);
      } else {
        // shake wrong pick
        setShakeLetter(selectedOption);
        setTimeout(() => setShakeLetter(null), 600);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }, [selectedOption, submitting, currentQ, id, currentIndex]);

  /* ── complete interview ── */
  const handleComplete = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await completeMockInterview(id);
      setInterview(res.data);
      setView('results');
    } catch (e) {
      alert('Failed to complete interview. Please try again.');
    } finally {
      setCompleting(false);
    }
  }, [completing, id]);

  /* ── grade helper ── */
  const getGrade = (score) => {
    if (score >= 90) return { label: 'A+', color: 'text-emerald-500' };
    if (score >= 80) return { label: 'A',  color: 'text-green-500' };
    if (score >= 70) return { label: 'B',  color: 'text-blue-500' };
    if (score >= 60) return { label: 'C',  color: 'text-yellow-500' };
    return                  { label: 'D',  color: 'text-red-500' };
  };

  /* ── option style ── */
  const getOptionStyle = (letter) => {
    const isSelected = selectedOption === letter;
    const isAnswered = !!currentQ?.userAnswer;
    const userPick   = currentQ?.userAnswer;
    const correct    = currentQ?.correct?.trim().toUpperCase();

    if (!isAnswered) {
      // pre-submit
      return isSelected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-glow scale-[1.01]'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10';
    }

    // post-submit
    if (letter === correct) {
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    }
    if (letter === userPick && userPick !== correct) {
      return 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
    return 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500';
  };

  /* ── dot nav style ── */
  const getDotStyle = (idx) => {
    const q = questions[idx];
    if (idx === currentIndex) return 'bg-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700 scale-125';
    if (!q?.userAnswer)       return 'bg-gray-200 dark:bg-gray-700';
    if (isQ(q.isCorrect))     return 'bg-emerald-500';
    return 'bg-red-400';
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  /* LOADING                                                                  */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse shadow-glow">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading interview…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-4">
        <XCircle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-gray-700 dark:text-gray-300 font-semibold">{error}</p>
        <button onClick={() => navigate('/mock-interview')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          Back to Interviews
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════ */
  /* RESULTS VIEW                                                             */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (view === 'results' && interview) {
    const total   = questions.length;
    const correct = questions.filter(q => isQ(q.isCorrect)).length;
    const wrong   = total - correct;
    const grade   = getGrade(interview.overallScore);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* inline keyframes */}
        <style>{`
          @keyframes scoreReveal {
            from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
            to   { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .anim-score-reveal { animation: scoreReveal 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards; }
          .anim-slide-up-fade { animation: slideUpFade 0.5s ease forwards; }
        `}</style>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* back */}
          <button onClick={() => navigate('/mock-interview')}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Interviews</span>
          </button>

          {/* hero card */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white mb-6 shadow-glow-lg animate-slide-up overflow-hidden relative">
            {/* decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* score ring */}
              <div className="anim-score-reveal flex-shrink-0">
                <ScoreRing score={interview.overallScore} size={160} stroke={12} />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                  <span className="text-white/80 font-medium">Interview Complete</span>
                </div>
                <h1 className="text-3xl font-black mb-1">{interview.role}</h1>
                <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
                  <span className={`text-5xl font-black ${grade.color.replace('text-', 'text-')} drop-shadow`}>
                    {grade.label}
                  </span>
                  <div className="text-white/70 text-sm">
                    <div>{correct} correct out of {total}</div>
                    <div>{Math.round((correct / total) * 100)}% accuracy</div>
                  </div>
                </div>
                <p className="text-white/85 text-sm leading-relaxed max-w-lg">
                  {interview.overallFeedback}
                </p>
              </div>
            </div>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger">
            {[
              { label: 'Total',    value: total,   icon: BarChart2,    color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Correct',  value: correct, icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Wrong',    value: wrong,   icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Accuracy', value: `${Math.round((correct / total) * 100)}%`, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5 flex items-center space-x-4 animate-slide-up">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* per-question review */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h2 className="font-bold text-gray-900 dark:text-white">Question Review</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {questions.map((q, idx) => {
                const tc = typeConfig[q.type] || typeConfig.technical;
                const TypeIcon = tc.Icon;
                const userPick = q.userAnswer?.trim().toUpperCase();
                const correctPick = q.correct?.trim().toUpperCase();
                const wasCorrect = isQ(q.isCorrect);

                return (
                  <div key={idx} className="p-6 anim-slide-up-fade" style={{ animationDelay: `${idx * 0.05}s` }}>
                    {/* question header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          wasCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tc.color}`}>
                              <TypeIcon className="h-3 w-3" />
                              <span>{tc.label}</span>
                            </span>
                            {wasCorrect
                              ? <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"><CheckCircle className="h-3.5 w-3.5" /><span>Correct</span></span>
                              : <span className="inline-flex items-center space-x-1 text-xs text-red-500 dark:text-red-400 font-semibold"><XCircle className="h-3.5 w-3.5" /><span>Wrong</span></span>
                            }
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">{q.question}</p>
                        </div>
                      </div>
                    </div>

                    {/* options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11 mb-3">
                      {optionLetters.map((letter, oi) => {
                        const text = Array.isArray(q.options) ? q.options[oi] : q.options?.[letter];
                        if (!text) return null;
                        const isCorrectOpt = letter === correctPick;
                        const isUserWrong  = letter === userPick && !wasCorrect;
                        return (
                          <div key={letter}
                            className={`flex items-start space-x-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                              isCorrectOpt
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : isUserWrong
                                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500'
                            }`}>
                            <span className={`font-bold flex-shrink-0 ${
                              isCorrectOpt ? 'text-emerald-600 dark:text-emerald-400' :
                              isUserWrong  ? 'text-red-500' : 'text-gray-400'
                            }`}>{letter}.</span>
                            <span className="leading-snug">{typeof text === 'string' ? text.replace(/^[A-D]\.\s*/, '') : text}</span>
                            {isCorrectOpt && <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 ml-auto" />}
                            {isUserWrong  && <XCircle    className="h-4 w-4 text-red-400 flex-shrink-0 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* explanation */}
                    {q.explanation && (
                      <div className="ml-11 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                          <span className="font-bold">Explanation: </span>{q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button onClick={() => navigate('/mock-interview')}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Start New Interview</span>
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="flex-1 py-4 px-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center space-x-2">
              <BarChart2 className="h-5 w-5" />
              <span>View Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /* QUIZ VIEW                                                                */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (!currentQ) return null;

  const tc = typeConfig[currentQ.type] || typeConfig.technical;
  const TypeIcon = tc.Icon;
  const isAnswered = !!currentQ.userAnswer;
  const correctLetter = currentQ.correct?.trim().toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── inline keyframes ── */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0.95); }
          40%  { transform: scale(1.04); }
          70%  { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes confettiFly {
          0%   { opacity: 1; transform: translate(0,0) rotate(0deg) scale(1); }
          80%  { opacity: 0.8; }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.3); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .anim-shake    { animation: shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both; }
        .anim-bounce-in{ animation: bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-pop-in   { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .confetti-particle {
          position: absolute;
          pointer-events: none;
          animation: confettiFly 1.2s ease-out forwards;
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── header ── */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <button onClick={() => navigate('/mock-interview')}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">{interview?.role}</div>
              <div className="text-xs text-gray-400 mt-0.5">Mock Interview</div>
            </div>
          </div>

          {/* live score */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card">
            <Award className="h-4 w-4 text-indigo-500" />
            <div className="text-right">
              <div className="text-sm font-black text-gray-900 dark:text-white leading-none">
                {correct.length}/{answered.length || 0}
              </div>
              <div className="text-[10px] text-gray-400 font-medium">
                {answered.length > 0 ? `${liveScore}%` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ── progress ring + dot nav ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-4 mb-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-4">
            <ProgressRing current={currentIndex + 1} total={questions.length} size={56} stroke={5} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {answered.length} answered
                </span>
              </div>
              {/* dot nav */}
              <div className="flex flex-wrap gap-1.5">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    title={`Question ${idx + 1}`}
                    className={`w-5 h-5 rounded-full transition-all duration-200 ${getDotStyle(idx)}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── question card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6 mb-4 animate-slide-up relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
          {/* confetti layer */}
          {confetti.map((p) => (
            <div
              key={p.id}
              className="confetti-particle"
              style={{
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--rot': `${p.rotate}deg`,
                width: p.size,
                height: p.size,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                background: p.color,
                top: '50%',
                left: '50%',
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                zIndex: 20,
              }}
            />
          ))}

          {/* type badge */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${tc.color}`}>
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{tc.label}</span>
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* question text */}
          <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed mb-6">
            {currentQ.question}
          </p>

          {/* options */}
          <div className="space-y-3">
            {optionLetters.map((letter, oi) => {
              const text = Array.isArray(currentQ.options) ? currentQ.options[oi] : currentQ.options?.[letter];
              if (!text) return null;

              const isSelected = selectedOption === letter;
              const isCorrectOpt = isAnswered && letter === correctLetter;
              const isWrongPick  = isAnswered && letter === currentQ.userAnswer && !isQ(currentQ.isCorrect);

              return (
                <button
                  key={letter}
                  onClick={() => handleSelectOption(letter)}
                  disabled={isAnswered}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 font-medium text-sm
                    ${getOptionStyle(letter)}
                    ${isCorrectOpt ? 'anim-bounce-in' : ''}
                    ${isWrongPick || shakeLetter === letter ? 'anim-shake' : ''}
                    ${!isAnswered && !isSelected ? 'cursor-pointer' : ''}
                    ${isAnswered ? 'cursor-default' : ''}
                  `}
                >
                  {/* letter badge */}
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                    isCorrectOpt
                      ? 'bg-emerald-500 text-white'
                      : isWrongPick
                        ? 'bg-red-400 text-white'
                        : isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">{typeof text === 'string' ? text.replace(/^[A-D]\.\s*/, '') : text}</span>
                  {isCorrectOpt && <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                  {isWrongPick  && <XCircle    className="h-5 w-5 text-red-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* feedback */}
          {answerResult && (
            <div className={`mt-5 p-4 rounded-xl border anim-pop-in ${
              answerResult.isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-2">
                {answerResult.isCorrect
                  ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <XCircle    className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                }
                <p className={`text-sm leading-relaxed ${
                  answerResult.isCorrect
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {answerResult.feedback}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── action bar ── */}
        <div className="flex items-center justify-between gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {/* prev */}
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>

          {/* submit / next */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedOption || submitting}
                className={`flex-1 max-w-xs py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                  selectedOption && !submitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}>
                {submitting
                  ? <><Loader className="h-4 w-4 animate-spin" /><span>Checking…</span></>
                  : <><Zap className="h-4 w-4" /><span>Submit Answer</span></>
                }
              </button>
            ) : allAnswered ? (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 max-w-xs py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-glow-green hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2">
                {completing
                  ? <><Loader className="h-4 w-4 animate-spin" /><span>Finishing…</span></>
                  : <><Trophy className="h-4 w-4" /><span>See Results</span></>
                }
              </button>
            ) : (
              <button
                onClick={() => {
                  const next = questions.findIndex((q, i) => i > currentIndex && !q.userAnswer);
                  if (next !== -1) setCurrentIndex(next);
                  else setCurrentIndex(i => Math.min(questions.length - 1, i + 1));
                }}
                className="flex-1 max-w-xs py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2">
                <span>Next Question</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* next */}
          <button
            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── complete early banner ── */}
        {allAnswered && !completing && (
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">All questions answered!</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  {correct.length}/{questions.length} correct · {liveScore}% score
                </p>
              </div>
            </div>
            <button onClick={handleComplete}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center space-x-1.5">
              <Trophy className="h-4 w-4" />
              <span>Finish</span>
            </button>
          </div>
        )}

        {/* ── clock / meta ── */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400 dark:text-gray-500 animate-fade-in">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Take your time</span>
          </span>
          <span>·</span>
          <span className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>{interview?.role}</span>
          </span>
        </div>

      </div>
    </div>
  );
}
