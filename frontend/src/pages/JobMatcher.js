import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobMatchResumes, analyzeJobMatch, analyzeJobMatchFile } from '../services/api';
import {
  Target, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  Sparkles, TrendingUp, Zap, ChevronDown, Loader, RefreshCw,
  Wand2, ArrowRight, X, File
} from 'lucide-react';


/* ── circular match score ring ── */
function MatchRing({ score, size = 140, stroke = 12 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (score / 100) * circ), 300);
    return () => clearTimeout(t);
  }, [score, circ]);

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Low';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
            strokeWidth={stroke} className="text-gray-100 dark:text-gray-800" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900 dark:text-white">{score}%</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Match</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

/* ── keyword tag ── */
const KeywordTag = ({ word, matched }) => (
  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${
    matched
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
  }`}>
    {matched ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    <span>{word}</span>
  </span>
);

export default function JobMatcher() {
  const navigate = useNavigate();

  /* state */
  const [resumes,      setResumes]      = useState([]);
  const [selectedId,   setSelectedId]   = useState('');
  const [jdText,       setJdText]       = useState('');
  const [jdFile,       setJdFile]       = useState(null);
  const [inputMode,    setInputMode]    = useState('text'); // 'text' | 'file'
  const [analyzing,    setAnalyzing]    = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [activeGapTab, setActiveGapTab] = useState('');
  const fileInputRef = useRef(null);

  /* load resumes */
  useEffect(() => {
    (async () => {
      try {
        const r = await getJobMatchResumes();
        setResumes(r.data || []);
        if (r.data?.length > 0) setSelectedId(String(r.data[0].id));
      } catch (e) { console.error(e); }
      finally { setLoadingResumes(false); }
    })();
  }, []);

  /* handle JD file pick */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { setError('Only PDF, DOCX, DOC, TXT files allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
    setJdFile(f); setError('');
  };

  /* run analysis */
  const handleAnalyze = async () => {
    if (!selectedId) { setError('Please select a resume'); return; }
    if (inputMode === 'text' && jdText.trim().length < 50) { setError('Job description must be at least 50 characters'); return; }
    if (inputMode === 'file' && !jdFile) { setError('Please upload a job description file'); return; }

    setAnalyzing(true); setError(''); setResult(null);
    try {
      let res;
      if (inputMode === 'file') {
        res = await analyzeJobMatchFile(selectedId, jdFile);
      } else {
        res = await analyzeJobMatch(selectedId, jdText);
      }
      setResult(res.data);
      // set first gap tab
      const gaps = Object.entries(res.data.skillGap || {}).filter(([, v]) => v?.length > 0);
      if (gaps.length > 0) setActiveGapTab(gaps[0][0]);
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const charCount = jdText.length;
  const gapEntries = Object.entries(result?.skillGap || {}).filter(([, v]) => Array.isArray(v) && v.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── header ── */}
        <div className="mb-8 animate-slide-up">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full border border-indigo-200 dark:border-indigo-800 mb-4">
            <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Job Description Matcher
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Job Matcher</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Paste or upload a job description — see how well your resume matches and get tailored improvement tips
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: input panel ── */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>

            {/* resume selector */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Select Your Resume
              </label>
              {loadingResumes ? (
                <div className="flex items-center space-x-2 text-gray-400 text-sm py-2">
                  <Loader className="h-4 w-4 animate-spin" /><span>Loading resumes…</span>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No resumes uploaded yet</p>
                  <button onClick={() => navigate('/upload')}
                    className="flex items-center space-x-2 mx-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-sm hover:scale-105 transition-all">
                    <Upload className="h-4 w-4" /><span>Upload Resume</span>
                  </button>
                </div>
              ) : (
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white outline-none transition-all text-sm">
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.fileName} {r.detectedRole ? `— ${r.detectedRole}` : ''} {r.atsScore ? `(ATS: ${r.atsScore})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* JD input */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Job Description</label>
                {/* toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  {[{ key: 'text', label: 'Paste' }, { key: 'file', label: 'Upload' }].map(({ key, label }) => (
                    <button key={key} onClick={() => { setInputMode(key); setError(''); }}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        inputMode === key
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>

              {inputMode === 'text' ? (
                <div className="relative">
                  <textarea
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    rows={12}
                    placeholder="Paste the full job description here...&#10;&#10;Include requirements, responsibilities, and preferred qualifications for the best match analysis."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white outline-none transition-all text-sm resize-none"
                  />
                  <div className={`absolute bottom-3 right-3 text-xs font-medium ${charCount < 50 ? 'text-red-400' : 'text-gray-400'}`}>
                    {charCount} chars {charCount < 50 ? `(need ${50 - charCount} more)` : ''}
                  </div>
                </div>
              ) : (
                <div>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} />
                  {jdFile ? (
                    <div className="flex items-center space-x-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <File className="h-8 w-8 text-indigo-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{jdFile.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{(jdFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => setJdFile(null)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group">
                      <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload JD file</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, DOC, TXT · Max 5MB</p>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* error */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-400 animate-fade-in">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* analyze button */}
            <button onClick={handleAnalyze}
              disabled={analyzing || loadingResumes || !selectedId}
              className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg relative overflow-hidden group ${
                !analyzing && selectedId
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}>
              {analyzing
                ? <><Loader className="h-5 w-5 animate-spin" /><span>Analyzing Match…</span></>
                : result
                ? <><RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" /><span>Re-analyze</span></>
                : <><Target className="h-5 w-5" /><span>Analyze Match</span></>}
            </button>

            {/* tips */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-3 flex items-center space-x-2">
                <Sparkles className="h-4 w-4" /><span>Tips for best results</span>
              </h3>
              <ul className="space-y-2 text-sm text-white/85">
                {[
                  'Paste the complete JD including requirements',
                  'Include "preferred" skills section too',
                  'Use the most recent version of your resume',
                  'Run for each job you apply to'
                ].map((t, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-indigo-200 font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── RIGHT: results ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* analyzing loader */}
            {analyzing && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-12 text-center animate-slide-up">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing job match…</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Comparing your resume against the job description</p>
                <div className="max-w-sm mx-auto space-y-3">
                  {[
                    { icon: '🔍', text: 'Extracting JD keywords & requirements' },
                    { icon: '📋', text: 'Scanning resume for matches' },
                    { icon: '📊', text: 'Calculating match percentage' },
                    { icon: '💡', text: 'Generating tailored suggestions' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{s.text}</span>
                      <div className="ml-auto w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* empty state */}
            {!analyzing && !result && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-12 text-center animate-slide-up">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-10 w-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ready to match your resume</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Select a resume, paste or upload a job description, then click Analyze Match to see your compatibility score and get personalized improvement tips.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-8">
                  {[
                    { icon: '🎯', label: 'Match Score' },
                    { icon: '✅', label: 'Matched Skills' },
                    { icon: '💡', label: 'Suggestions' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* results */}
            {!analyzing && result && (
              <div className="space-y-5 animate-slide-up">

                {/* score hero */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <MatchRing score={result.matchScore} />
                    <div className="flex-1 text-center sm:text-left">
                      {result.jobTitle && (
                        <div className="inline-flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1 mb-3">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-sm font-semibold">{result.jobTitle}</span>
                        </div>
                      )}
                      <h2 className="text-2xl font-black mb-2">{result.fileName}</h2>
                      {result.overallFit && (
                        <p className="text-white/85 text-sm leading-relaxed">{result.overallFit}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                          <div className="text-xl font-black">{result.matchedKeywords?.length || 0}</div>
                          <div className="text-xs text-white/70">Matched</div>
                        </div>
                        <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                          <div className="text-xl font-black">{result.missingKeywords?.length || 0}</div>
                          <div className="text-xs text-white/70">Missing</div>
                        </div>
                        {result.requiredSkillsCoverage > 0 && (
                          <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                            <div className="text-xl font-black">{result.requiredSkillsCoverage}%</div>
                            <div className="text-xs text-white/70">Required</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* keywords grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* matched */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Matched Keywords</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.matchedKeywords?.length || 0} found in your resume</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {(result.matchedKeywords || []).map((kw, i) => (
                        <KeywordTag key={i} word={kw} matched={true} />
                      ))}
                      {(result.matchedKeywords || []).length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No matching keywords found</p>
                      )}
                    </div>
                  </div>

                  {/* missing */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Missing Keywords</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.missingKeywords?.length || 0} not in your resume</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {(result.missingKeywords || []).map((kw, i) => (
                        <KeywordTag key={i} word={kw} matched={false} />
                      ))}
                      {(result.missingKeywords || []).length === 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">🎉 No missing keywords!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* skill gap by category */}
                {gapEntries.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
                    <div className="flex items-center space-x-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white">Skill Gap by Category</h3>
                    </div>
                    {/* category tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {gapEntries.map(([cat]) => (
                        <button key={cat} onClick={() => setActiveGapTab(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                            activeGapTab === cat
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                          }`}>{cat} ({result.skillGap[cat]?.length})</button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(result.skillGap[activeGapTab] || []).map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-full text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* tailored suggestions */}
                {(result.tailoredSuggestions || []).length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-5">
                    <div className="flex items-center space-x-2 mb-4">
                      <Zap className="h-5 w-5 text-indigo-500" />
                      <h3 className="font-bold text-gray-900 dark:text-white">Tailored Suggestions</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                        Specific to this JD
                      </span>
                    </div>
                    <div className="space-y-3">
                      {result.tailoredSuggestions.map((s, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA — enhance with JD */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1 flex items-center space-x-2">
                        <Wand2 className="h-5 w-5" /><span>Enhance Resume for This Job</span>
                      </h3>
                      <p className="text-white/80 text-sm">
                        AI will instantly rewrite your resume with the missing keywords and
                        tailored language — you'll land directly on the final result.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Pass JD text (text mode) so EnhanceResume can auto-run JD-tailored enhance.
                        // File objects can't be serialised into navigate state, so file-mode
                        // triggers a general auto-enhance instead.
                        const state =
                          inputMode === 'text' && jdText.trim().length > 50
                            ? { autoEnhanceJD: jdText.trim() }
                            : { autoEnhance: true };
                        navigate(`/resume/${result.resumeId}/enhance`, { state });
                      }}
                      className="flex items-center space-x-2 px-5 py-3 bg-white text-violet-700 font-bold rounded-xl hover:scale-105 transition-all flex-shrink-0 shadow-lg">
                      <span>Enhance Now</span><ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
