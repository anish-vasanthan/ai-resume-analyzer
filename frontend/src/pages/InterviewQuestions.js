import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInterviewQuestions } from '../services/api';
import {
  ArrowLeft, Code, Users, Lightbulb, Play, Sparkles,
  ChevronDown, ChevronUp, CheckCircle, Eye, EyeOff
} from 'lucide-react';

const optionLetters = ['A', 'B', 'C', 'D'];

const categories = [
  { key: 'technical', label: 'Technical', icon: Code,      color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-700 dark:text-indigo-300' },
  { key: 'hr',        label: 'HR',         icon: Users,     color: 'from-green-500 to-emerald-600',  bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-700 dark:text-green-400' },
  { key: 'scenario',  label: 'Scenario',   icon: Lightbulb, color: 'from-yellow-500 to-orange-500',  bg: 'bg-yellow-50 dark:bg-yellow-900/20',  text: 'text-yellow-700 dark:text-yellow-400' },
];

// Normalise a question entry — backend returns MCQ objects {question,options,correct,explanation}
// but older data might be plain strings
const normalise = (q) => {
  if (typeof q === 'string') return { question: q, options: [], correct: null, explanation: null };
  return q;
};

const MCQCard = ({ mcq, index, category }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [expanded, setExpanded]     = useState(false);
  const cat = categories.find(c => c.key === category);

  const { question, options = [], correct, explanation } = normalise(mcq);
  const hasOptions = Array.isArray(options) && options.length > 0;

  const getOptionStyle = (letter, idx) => {
    if (!showAnswer && selected !== letter) {
      return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer';
    }
    if (!showAnswer && selected === letter) {
      return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 cursor-pointer';
    }
    // answer revealed
    if (letter === correct) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    }
    if (letter === selected && letter !== correct) {
      return 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    }
    return 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600';
  };

  return (
    <div className="card-hover bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden animate-slide-up group">
      {/* Question header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cat.color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white font-semibold leading-relaxed">{question}</p>
          </div>
          {hasOptions && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex-shrink-0"
              title={expanded ? 'Collapse' : 'Show options'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Options — shown when expanded */}
      {hasOptions && expanded && (
        <div className="px-5 pb-4 space-y-2 border-t border-gray-50 dark:border-gray-800 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {optionLetters.map((letter, oi) => {
              const text = options[oi];
              if (!text) return null;
              const cleanText = typeof text === 'string' ? text.replace(/^[A-D]\.\s*/, '') : text;
              const isCorrectOpt = showAnswer && letter === correct;
              const isWrongPick  = showAnswer && letter === selected && letter !== correct;

              return (
                <button
                  key={letter}
                  onClick={() => !showAnswer && setSelected(letter)}
                  disabled={showAnswer}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left ${getOptionStyle(letter, oi)}`}
                >
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrectOpt ? 'bg-green-500 text-white'
                    : isWrongPick ? 'bg-red-400 text-white'
                    : selected === letter && !showAnswer ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">{cleanText}</span>
                  {isCorrectOpt && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Reveal / explanation row */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                showAnswer
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-glow hover:shadow-glow-lg hover:scale-105'
              }`}
            >
              {showAnswer
                ? <><EyeOff className="h-4 w-4" /><span>Hide Answer</span></>
                : <><Eye className="h-4 w-4" /><span>Reveal Answer</span></>}
            </button>

            {showAnswer && correct && (
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Answer: {correct}</span>
              </span>
            )}
          </div>

          {/* Explanation */}
          {showAnswer && explanation && (
            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl animate-fade-in">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                <span className="font-bold">Explanation: </span>{explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function InterviewQuestions() {
  const { resumeId } = useParams();
  const navigate     = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [role, setRole]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('technical');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuestions(); }, [resumeId]);

  const loadQuestions = async () => {
    try {
      const r = await getInterviewQuestions(resumeId);
      setQuestions(r.data.questions);
      setRole(r.data.role);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  const activeQuestions = questions?.[activeTab] || [];
  const totalCount = (questions?.technical?.length || 0) + (questions?.hr?.length || 0) + (questions?.scenario?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <button
            onClick={() => navigate(`/resume/${resumeId}`)}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Resume</span>
          </button>
          <Link
            to="/mock-interview"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg hover:scale-105 transition-all text-sm"
          >
            <Play className="h-4 w-4" />
            <span>Start Mock Interview</span>
          </Link>
        </div>

        {/* Hero banner */}
        <div
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 text-white animate-slide-up relative overflow-hidden"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-white/80 text-sm font-medium">AI-Generated MCQ Questions</span>
            </div>
            <h1 className="text-3xl font-black mb-2">{role} Interview</h1>
            <p className="text-white/80 mb-4">{totalCount} questions · Click a card to expand options</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat.key} className="flex items-center space-x-1.5 bg-white/20 rounded-full px-3 py-1">
                  <cat.icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{questions?.[cat.key]?.length || 0} {cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 animate-slide-up" style={{ animationDelay: '0.10s' }}>
          {categories.map(cat => {
            const Icon = cat.icon;
            const count = questions?.[cat.key]?.length || 0;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === cat.key
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-glow`
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:border-indigo-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  activeTab === cat.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center space-x-1 animate-fade-in">
          <ChevronDown className="h-3 w-3" />
          <span>Click the expand icon on any card to see options and reveal the answer</span>
        </p>

        {/* Question cards */}
        <div className="space-y-3 stagger">
          {activeQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No questions available for this category.
            </div>
          ) : (
            activeQuestions.map((q, i) => (
              <MCQCard
                key={i}
                mcq={q}
                index={i}
                category={activeTab}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
