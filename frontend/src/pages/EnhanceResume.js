import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getResume, enhanceResume, getEnhancement } from '../services/api';
import jsPDF from 'jspdf';
import {
  ArrowLeft, Wand2, Download, RefreshCw, CheckCircle, Eye,
  XCircle, AlertTriangle, ChevronDown, ChevronUp, Edit3, Save,
  Sparkles, TrendingUp, Zap, Brain, Star, Plus, Trash2, X
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   SEVERITY BADGE
════════════════════════════════════════════════════════════ */
const SeverityBadge = ({ severity }) => {
  const map = {
    high:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${map[severity] || map.low}`}>
      {severity}
    </span>
  );
};

/* ════════════════════════════════════════════════════════════
   MISTAKE CARD
════════════════════════════════════════════════════════════ */
const MistakeCard = ({ mistake, index }) => {
  const [open, setOpen] = useState(false);
  const colors = {
    experience: 'from-orange-500 to-red-500',
    projects:   'from-blue-500 to-indigo-500',
    summary:    'from-purple-500 to-violet-500',
    skills:     'from-teal-500 to-cyan-500',
    education:  'from-green-500 to-emerald-500',
    general:    'from-gray-500 to-slate-500'
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colors[mistake.section] || colors.general} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{mistake.section}</span>
              <SeverityBadge severity={mistake.severity} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{mistake.issue}</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
               : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-gray-800 pt-3">
          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center space-x-1">
              <XCircle className="h-3.5 w-3.5" /><span>BEFORE</span>
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{mistake.original}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
            <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1 flex items-center space-x-1">
              <CheckCircle className="h-3.5 w-3.5" /><span>AFTER</span>
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">{mistake.fixed}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   A4 PREVIEW — paper-like resume render
════════════════════════════════════════════════════════════ */
const ResumePreview = ({ sections, resume }) => {
  const skills = sections.skills || {};
  return (
    <div className="flex justify-center py-6 bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-auto">
      {/* A4 paper */}
      <div style={{ width: '210mm', minHeight: '297mm', background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.18)', padding: '18mm 16mm', fontFamily: 'Georgia, serif', color: '#111', fontSize: '11pt', lineHeight: '1.5' }}>

        {/* Header */}
        <div style={{ borderBottom: '2.5px solid #7c3aed', paddingBottom: '8px', marginBottom: '14px' }}>
          <div style={{ fontSize: '22pt', fontWeight: '900', fontFamily: 'Arial, sans-serif', color: '#1a1a1a', letterSpacing: '-0.5px' }}>
            {resume?.parsedData?.name || 'Your Name'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px', fontSize: '9.5pt', color: '#555', fontFamily: 'Arial, sans-serif' }}>
            {resume?.parsedData?.email && <span>{resume.parsedData.email}</span>}
            {resume?.parsedData?.phone && <span>{resume.parsedData.phone}</span>}
            {resume?.detectedRole && <span style={{ color: '#7c3aed', fontWeight: '700' }}>{resume.detectedRole}</span>}
          </div>
        </div>

        {/* Summary */}
        {sections.summary && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#7c3aed', fontFamily: 'Arial, sans-serif', marginBottom: '5px' }}>
              Professional Summary
            </div>
            <p style={{ fontSize: '10.5pt', color: '#333', lineHeight: '1.65' }}>{sections.summary}</p>
          </div>
        )}

        {/* Experience */}
        {(sections.experience || []).length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#7c3aed', fontFamily: 'Arial, sans-serif', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '8px' }}>
              Experience
            </div>
            {sections.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11pt', fontWeight: '700', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>{exp.title}</span>
                  <span style={{ fontSize: '9pt', color: '#888', fontFamily: 'Arial, sans-serif' }}>{exp.duration}</span>
                </div>
                <div style={{ fontSize: '10pt', color: '#7c3aed', fontWeight: '600', fontFamily: 'Arial, sans-serif', marginBottom: '4px' }}>{exp.company}</div>
                {(exp.bullets || []).map((b, j) => (
                  <div key={j} style={{ fontSize: '10pt', color: '#333', paddingLeft: '14px', position: 'relative', marginBottom: '2px' }}>
                    <span style={{ position: 'absolute', left: '4px' }}>•</span>
                    {b.replace(/^[•\-\*]\s*/, '')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {(sections.projects || []).length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#7c3aed', fontFamily: 'Arial, sans-serif', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '8px' }}>
              Projects
            </div>
            {sections.projects.map((p, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11pt', fontWeight: '700', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>{p.name}</span>
                  {p.technologies && <span style={{ fontSize: '8.5pt', color: '#7c3aed', fontFamily: 'Arial, sans-serif' }}>{p.technologies}</span>}
                </div>
                <p style={{ fontSize: '10pt', color: '#333', marginTop: '3px' }}>{p.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {Object.keys(skills).length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#7c3aed', fontFamily: 'Arial, sans-serif', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '8px' }}>
              Skills
            </div>
            {Object.entries(skills).map(([cat, list]) =>
              Array.isArray(list) && list.length > 0 ? (
                <div key={cat} style={{ fontSize: '10pt', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>{cat}: </span>
                  <span style={{ color: '#444' }}>{list.join(', ')}</span>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Education */}
        {(sections.education || []).length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#7c3aed', fontFamily: 'Arial, sans-serif', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '8px' }}>
              Education
            </div>
            {sections.education.map((e, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11pt', fontWeight: '700', fontFamily: 'Arial, sans-serif', color: '#1a1a1a' }}>{e.degree}</span>
                  <span style={{ fontSize: '9pt', color: '#888', fontFamily: 'Arial, sans-serif' }}>{e.year}</span>
                </div>
                <div style={{ fontSize: '10pt', color: '#555', fontFamily: 'Arial, sans-serif' }}>
                  {e.institution}{e.gpa ? ` — GPA: ${e.gpa}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '20px', fontSize: '8pt', color: '#bbb', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          Enhanced by AI Resume Analyzer • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   EDIT PANEL — inline editing of every section
════════════════════════════════════════════════════════════ */
const EditPanel = ({ sections, onChange }) => {
  /* ── helpers ── */
  const updateSummary = (val) => onChange({ ...sections, summary: val });

  const updateExpField = (i, field, val) => {
    const exp = sections.experience.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
    onChange({ ...sections, experience: exp });
  };
  const updateExpBullet = (ei, bi, val) => {
    const exp = sections.experience.map((e, idx) => {
      if (idx !== ei) return e;
      const bullets = e.bullets.map((b, bIdx) => bIdx === bi ? val : b);
      return { ...e, bullets };
    });
    onChange({ ...sections, experience: exp });
  };
  const addExpBullet = (ei) => {
    const exp = sections.experience.map((e, idx) =>
      idx === ei ? { ...e, bullets: [...(e.bullets || []), '• '] } : e
    );
    onChange({ ...sections, experience: exp });
  };
  const removeExpBullet = (ei, bi) => {
    const exp = sections.experience.map((e, idx) => {
      if (idx !== ei) return e;
      return { ...e, bullets: e.bullets.filter((_, bIdx) => bIdx !== bi) };
    });
    onChange({ ...sections, experience: exp });
  };

  const updateProject = (i, field, val) => {
    const projects = sections.projects.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange({ ...sections, projects });
  };

  const updateSkillList = (cat, val) => {
    const list = val.split(',').map(s => s.trim()).filter(Boolean);
    onChange({ ...sections, skills: { ...sections.skills, [cat]: list } });
  };
  const addSkillCategory = () => {
    const cat = prompt('Category name (e.g. Databases):');
    if (!cat) return;
    onChange({ ...sections, skills: { ...sections.skills, [cat]: [] } });
  };
  const removeSkillCategory = (cat) => {
    const s = { ...sections.skills };
    delete s[cat];
    onChange({ ...sections, skills: s });
  };

  const updateEdu = (i, field, val) => {
    const education = sections.education.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
    onChange({ ...sections, education });
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none';
  const labelCls = 'block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6">

      {/* ── Summary ── */}
      {sections.summary !== undefined && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Professional Summary</h3>
          </div>
          <textarea rows={4} className={inputCls} value={sections.summary || ''}
            onChange={e => updateSummary(e.target.value)} placeholder="Write your professional summary..." />
        </div>
      )}

      {/* ── Experience ── */}
      {(sections.experience || []).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Experience</h3>
          </div>
          <div className="space-y-5">
            {sections.experience.map((exp, ei) => (
              <div key={ei} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Job Title</label>
                    <input type="text" className={inputCls} value={exp.title || ''}
                      onChange={e => updateExpField(ei, 'title', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Company</label>
                    <input type="text" className={inputCls} value={exp.company || ''}
                      onChange={e => updateExpField(ei, 'company', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Duration</label>
                  <input type="text" className={inputCls} value={exp.duration || ''}
                    onChange={e => updateExpField(ei, 'duration', e.target.value)} placeholder="e.g. Jan 2022 – Dec 2023" />
                </div>
                <div>
                  <label className={labelCls}>Bullet Points</label>
                  <div className="space-y-2">
                    {(exp.bullets || []).map((b, bi) => (
                      <div key={bi} className="flex items-start space-x-2">
                        <textarea rows={2} className={`${inputCls} flex-1`}
                          value={b.replace(/^[•\-\*]\s*/, '')}
                          onChange={e => updateExpBullet(ei, bi, e.target.value)}
                          placeholder="Describe your achievement..." />
                        <button onClick={() => removeExpBullet(ei, bi)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0 mt-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addExpBullet(ei)}
                      className="flex items-center space-x-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold transition-colors">
                      <Plus className="h-3.5 w-3.5" /><span>Add bullet</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects ── */}
      {(sections.projects || []).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="h-4 w-4 text-blue-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Projects</h3>
          </div>
          <div className="space-y-4">
            {sections.projects.map((p, pi) => (
              <div key={pi} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Project Name</label>
                    <input type="text" className={inputCls} value={p.name || ''}
                      onChange={e => updateProject(pi, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Technologies</label>
                    <input type="text" className={inputCls} value={p.technologies || ''}
                      onChange={e => updateProject(pi, 'technologies', e.target.value)} placeholder="React, Node.js, MongoDB" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={3} className={inputCls} value={p.description || ''}
                    onChange={e => updateProject(pi, 'description', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Skills ── */}
      {sections.skills && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Skills</h3>
            </div>
            <button onClick={addSkillCategory}
              className="flex items-center space-x-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold">
              <Plus className="h-3.5 w-3.5" /><span>Add category</span>
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(sections.skills).map(([cat, list]) =>
              Array.isArray(list) ? (
                <div key={cat} className="flex items-start space-x-2">
                  <div className="flex-1">
                    <label className={labelCls}>{cat}</label>
                    <input type="text" className={inputCls}
                      value={Array.isArray(list) ? list.join(', ') : ''}
                      onChange={e => updateSkillList(cat, e.target.value)}
                      placeholder="Comma-separated skills" />
                  </div>
                  <button onClick={() => removeSkillCategory(cat)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all mt-5 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* ── Education ── */}
      {(sections.education || []).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Education</h3>
          </div>
          <div className="space-y-4">
            {sections.education.map((e, ei) => (
              <div key={ei} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Degree</label>
                    <input type="text" className={inputCls} value={e.degree || ''}
                      onChange={ev => updateEdu(ei, 'degree', ev.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Year</label>
                    <input type="text" className={inputCls} value={e.year || ''}
                      onChange={ev => updateEdu(ei, 'year', ev.target.value)} placeholder="2024" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Institution</label>
                    <input type="text" className={inputCls} value={e.institution || ''}
                      onChange={ev => updateEdu(ei, 'institution', ev.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>GPA / CGPA</label>
                    <input type="text" className={inputCls} value={e.gpa || ''}
                      onChange={ev => updateEdu(ei, 'gpa', ev.target.value)} placeholder="8.6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   PDF GENERATOR — pure text, tiny file
════════════════════════════════════════════════════════════ */
function generateResumePDF(enhanced, resume) {
  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const sections = enhanced?.enhancedSections || {};
  const skills   = sections.skills || {};
  const PW = 210, ML = 18, MR = 18, TW = PW - ML - MR, PH = 297, BM = 20;
  let y = 20;
  const ACCENT = [124, 58, 237];

  const checkPage = (n = 8) => { if (y + n > PH - BM) { doc.addPage(); y = 20; } };

  const secHeader = (title) => {
    checkPage(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...ACCENT);
    doc.text(title.toUpperCase(), ML, y);
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.4); doc.line(ML, y + 1, ML + TW, y + 1);
    doc.setTextColor(30, 30, 30); y += 6;
  };

  const bodyText = (text, indent = 0) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
    doc.splitTextToSize(String(text), TW - indent).forEach(l => { checkPage(6); doc.text(l, ML + indent, y); y += 5; });
  };

  // Header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(20, 20, 20);
  doc.text(resume?.parsedData?.name || 'Resume', ML, y); y += 7;
  const cp = [resume?.parsedData?.email, resume?.parsedData?.phone, resume?.detectedRole].filter(Boolean);
  if (cp.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.text(cp.join('  |  '), ML, y); y += 5; }
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6); doc.line(ML, y, ML + TW, y); y += 6;

  if (sections.summary) { secHeader('Professional Summary'); bodyText(sections.summary); y += 3; }

  if ((sections.experience || []).length > 0) {
    secHeader('Experience');
    sections.experience.forEach(exp => {
      checkPage(14);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20, 20, 20);
      doc.text(exp.title || '', ML, y);
      if (exp.duration) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(exp.duration, ML + TW - doc.getTextWidth(exp.duration), y); }
      y += 5;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...ACCENT); doc.text(exp.company || '', ML, y); y += 5;
      (exp.bullets || []).forEach(b => {
        const clean = b.replace(/^[•\-\*]\s*/, '');
        checkPage(6); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(50, 50, 50);
        doc.text('•', ML + 2, y);
        doc.splitTextToSize(clean, TW - 8).forEach((l, li) => { checkPage(5); doc.text(l, ML + 7, y); if (li < doc.splitTextToSize(clean, TW - 8).length - 1) y += 4.5; });
        y += 5;
      });
      y += 2;
    });
  }

  if ((sections.projects || []).length > 0) {
    secHeader('Projects');
    sections.projects.forEach(p => {
      checkPage(12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20, 20, 20); doc.text(p.name || '', ML, y);
      if (p.technologies) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...ACCENT); doc.text(`(${p.technologies})`, ML + TW - doc.getTextWidth(`(${p.technologies})`), y); }
      y += 5;
      if (p.description) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(50, 50, 50); doc.splitTextToSize(p.description, TW).forEach(l => { checkPage(5); doc.text(l, ML, y); y += 4.5; }); }
      y += 3;
    });
  }

  const se = Object.entries(skills).filter(([, l]) => Array.isArray(l) && l.length > 0);
  if (se.length > 0) {
    secHeader('Skills');
    se.forEach(([cat, list]) => {
      checkPage(6);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(20, 20, 20);
      const cl = `${cat}: `, cw = doc.getTextWidth(cl);
      doc.text(cl, ML, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
      doc.splitTextToSize(list.join(', '), TW - cw).forEach((l, li) => { checkPage(5); doc.text(l, ML + cw, y); if (li < doc.splitTextToSize(list.join(', '), TW - cw).length - 1) y += 4.5; });
      y += 5;
    });
  }

  if ((sections.education || []).length > 0) {
    secHeader('Education');
    sections.education.forEach(e => {
      checkPage(10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20, 20, 20); doc.text(e.degree || '', ML, y);
      if (e.year) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(e.year, ML + TW - doc.getTextWidth(e.year), y); }
      y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100);
      doc.text(`${e.institution || ''}${e.gpa ? '  —  GPA: ' + e.gpa : ''}`, ML, y); y += 6;
    });
  }

  const tp = doc.internal.getNumberOfPages();
  for (let p = 1; p <= tp; p++) {
    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(180, 180, 180);
    doc.text(`Enhanced by AI Resume Analyzer  •  ${new Date().toLocaleDateString()}  •  Page ${p}/${tp}`, PW / 2, PH - 8, { align: 'center' });
  }
  return doc;
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function EnhanceResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [resume,       setResume]       = useState(null);
  const [enhanced,     setEnhanced]     = useState(null);
  const [editSections, setEditSections] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [enhancing,    setEnhancing]    = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [view,         setView]         = useState('sections');
  const [activeTab,    setActiveTab]    = useState('summary');
  const [filterSev,    setFilterSev]    = useState('all');

  // JD state
  const [jdText,       setJdText]       = useState('');
  const [jdFile,       setJdFile]       = useState(null);
  const [jdMode,       setJdMode]       = useState('none'); // 'none' | 'text' | 'file'
  const [showJdPanel,  setShowJdPanel]  = useState(false);

  // Holds a JD string (or empty string for general-enhance) passed from JobMatcher via
  // navigate state. We use a ref so it's available inside the load useEffect without
  // becoming a stale closure and without triggering extra renders.
  const autoEnhanceRef = useRef(null);

  useEffect(() => {
    // Capture any auto-enhance request from JobMatcher BEFORE starting to load,
    // so the ref is ready when loading finishes.
    const st = location.state;
    if (st) {
      if (st.autoEnhanceJD && st.autoEnhanceJD.trim().length > 50) {
        autoEnhanceRef.current = st.autoEnhanceJD.trim(); // JD-tailored
      } else if (st.autoEnhance) {
        autoEnhanceRef.current = '';  // general enhance (empty = no JD)
      }
      // Clear state so a page refresh doesn't re-trigger
      window.history.replaceState({}, '');
    }

    // If ?jd=1 in URL, auto-open the JD panel (original behaviour)
    const params = new URLSearchParams(location.search);
    if (params.get('jd') === '1' && !autoEnhanceRef.current) {
      setShowJdPanel(true);
      setJdMode('text');
    }
  }, []); // run once on mount

  useEffect(() => {
    (async () => {
      try {
        const r = await getResume(id);
        setResume(r.data);
        try {
          const e = await getEnhancement(id);
          setEnhanced(e.data);
          setEditSections(JSON.parse(JSON.stringify(e.data.enhancedSections || {})));
        } catch { /* no prior enhancement */ }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Once the resume has loaded AND we have a pending auto-enhance (from JobMatcher),
  // fire the enhancement immediately — user lands directly on the results view.
  useEffect(() => {
    if (!loading && autoEnhanceRef.current !== null) {
      const pendingJD = autoEnhanceRef.current;
      autoEnhanceRef.current = null; // clear so this only runs once
      // Pass the JD explicitly so we don't rely on stale jdMode/jdText state
      handleEnhance(false, pendingJD || undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // forceGeneral=true  → skip JD state entirely (general enhancement).
  // explicitJobInput   → pass a JD string or File directly, bypassing state.
  //                       Used by auto-enhance (from JobMatcher) and the
  //                       "Skip — General Enhance" button.
  const handleEnhance = async (forceGeneral = false, explicitJobInput = undefined) => {
    setEnhancing(true);
    try {
      let jobInput;
      if (explicitJobInput !== undefined) {
        // Caller supplied the input directly — use it regardless of state
        jobInput = explicitJobInput || undefined; // coerce empty string to undefined
      } else if (!forceGeneral) {
        if (jdMode === 'text' && jdText.trim().length > 50) jobInput = jdText.trim();
        else if (jdMode === 'file' && jdFile)               jobInput = jdFile;
      }

      const result = await enhanceResume(id, jobInput);
      setEnhanced(result.data);
      setEditSections(JSON.parse(JSON.stringify(result.data.enhancedSections || {})));
      setShowJdPanel(false);
      setJdMode('none');
      setJdText('');
      setJdFile(null);
      setActiveTab('summary');
      setView('sections');
    } catch (err) { alert(err.message || 'Enhancement failed.'); }
    finally { setEnhancing(false); }
  };

  const handleSaveEdits = useCallback(() => {
    if (!editSections) return;
    setEnhanced(prev => ({ ...prev, enhancedSections: editSections }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setView('preview');
  }, [editSections]);

  const handleDownload = () => {
    if (!enhanced) return;
    setDownloading(true);
    try {
      const src = view === 'edit' ? { ...enhanced, enhancedSections: editSections } : enhanced;
      const doc = generateResumePDF(src, resume);
      doc.save(`${(resume?.fileName || 'resume').replace(/\.[^.]+$/, '')}-enhanced.pdf`);
    } catch { alert('PDF generation failed.'); }
    finally { setDownloading(false); }
  };

  const sections    = (view === 'edit' ? editSections : enhanced?.enhancedSections) || {};
  const allMistakes = enhanced?.mistakes || [];
  const mistakes    = allMistakes.filter(m => filterSev === 'all' || m.severity === filterSev);
  const highCount   = allMistakes.filter(m => m.severity === 'high').length;
  const mediumCount = allMistakes.filter(m => m.severity === 'medium').length;
  const lowCount    = allMistakes.filter(m => m.severity === 'low').length;
  const jdAdded     = enhanced?.jdKeywordsAdded   || [];
  const jdMissing   = enhanced?.jdKeywordsMissing  || [];
  const isTailored  = enhanced?.tailoredToJD       || false;

  const tabs = [
    { key: 'summary',    label: 'Summary',    show: !!sections.summary },
    { key: 'experience', label: 'Experience', show: (sections.experience || []).length > 0 },
    { key: 'projects',   label: 'Projects',   show: (sections.projects   || []).length > 0 },
    { key: 'skills',     label: 'Skills',     show: !!sections.skills },
    { key: 'education',  label: 'Education',  show: (sections.education  || []).length > 0 },
  ].filter(t => t.show);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg">
        <Wand2 className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* top bar */}
        <div className="flex items-center justify-between mb-6 animate-slide-up flex-wrap gap-3">
          <button onClick={() => navigate(`/resume/${id}`)}
            className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Resume</span>
          </button>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {enhanced && !enhancing && (
              <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 space-x-1">
                {[
                  { key: 'sections', icon: Sparkles, label: 'Sections' },
                  { key: 'preview',  icon: Eye,      label: 'Preview'  },
                  { key: 'edit',     icon: Edit3,    label: 'Edit'     },
                ].map(({ key, icon: Icon, label }) => (
                  <button key={key} onClick={() => setView(key)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      view === key ? 'bg-violet-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    <Icon className="h-3.5 w-3.5" /><span>{label}</span>
                  </button>
                ))}
              </div>
            )}
            {view === 'edit' && (
              <button onClick={handleSaveEdits}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm">
                <Save className="h-4 w-4" /><span>{saved ? '✓ Saved!' : 'Save & Preview'}</span>
              </button>
            )}
            {enhanced && view !== 'edit' && (
              <button onClick={handleDownload} disabled={downloading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm disabled:opacity-50">
                {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
                <span>{downloading ? 'Generating…' : 'Download PDF'}</span>
              </button>
            )}
            {/* Show JD panel toggle only when there's already an enhancement (re-enhance with JD) */}
            {enhanced && !enhancing && (
              <button onClick={() => setShowJdPanel(p => !p)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                  showJdPanel || jdMode !== 'none'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600'
                }`}>
                <Brain className="h-4 w-4" />
                <span>{jdMode !== 'none' ? '✓ JD Set' : 'Re-enhance with JD'}</span>
              </button>
            )}
            <button onClick={handleEnhance} disabled={enhancing}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm disabled:opacity-50">
              {enhancing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>{enhancing ? 'Enhancing…' : enhanced ? 'Re-enhance' : 'Enhance Now'}</span>
            </button>
          </div>
        </div>

        {/* ── JD INPUT PANEL (re-enhance with JD when result already exists) ── */}
        {showJdPanel && !enhancing && enhanced && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 shadow-lg p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Re-enhance with Job Description</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI injects JD keywords and rewrites your resume to match this specific role</p>
                </div>
              </div>
              <button onClick={() => { setJdMode('none'); setJdText(''); setJdFile(null); setShowJdPanel(false); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              {[
                { key: 'text', label: '📝 Paste JD Text', desc: 'Copy-paste the job description' },
                { key: 'file', label: '📄 Upload JD File', desc: 'PDF, DOCX, or TXT' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setJdMode(opt.key)}
                  className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                    jdMode === opt.key
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {jdMode === 'text' && (
              <div>
                <textarea rows={5} value={jdText} onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the full job description here — requirements, responsibilities, preferred skills, tech stack, etc."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{jdText.length} chars{jdText.length > 0 && jdText.length < 50 ? ' — need 50+' : ''}</span>
                  {jdText.length >= 50 && <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Ready</span>}
                </div>
              </div>
            )}

            {jdMode === 'file' && (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                <input type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setJdFile(f); }} />
                {jdFile ? (
                  <div className="text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{jdFile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{(jdFile.size / 1024).toFixed(0)} KB — click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl mb-1">📎</div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload JD file</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, DOC, or TXT</p>
                  </div>
                )}
              </label>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEnhance}
                disabled={
                  enhancing ||
                  (jdMode === 'text' && jdText.trim().length < 50) ||
                  (jdMode === 'file' && !jdFile) ||
                  jdMode === 'none'
                }
                className="flex-1 flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm">
                <Wand2 className="h-4 w-4" /><span>Re-enhance with Job Description</span>
              </button>
              <button onClick={() => { setShowJdPanel(false); setJdMode('none'); setJdText(''); setJdFile(null); }}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* hero banner */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Wand2 className="h-5 w-5 text-violet-200" />
                <span className="text-white/80 text-sm font-medium">AI Resume Enhancer</span>
                {isTailored && (
                  <span className="px-2 py-0.5 bg-yellow-400/20 border border-yellow-400/40 text-yellow-200 text-xs font-bold rounded-full">
                    🎯 JD-Tailored
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black mb-1">{resume?.fileName}</h1>
              <p className="text-white/70 text-sm">
                {enhanced
                  ? `${allMistakes.length} issues fixed · ATS Score: ${enhanced.originalAtsScore}${isTailored ? ` · ${jdAdded.length} JD keywords injected` : ''}`
                  : 'Rewrite your resume with stronger language, ATS keywords, and quantified achievements'}
              </p>
            </div>
            {enhanced && (
              <div className="flex items-center space-x-4 bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 flex-shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-black">{enhanced.originalAtsScore}</div>
                  <div className="text-xs text-white/70">ATS Score</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-3xl font-black text-yellow-300">{allMistakes.length}</div>
                  <div className="text-xs text-white/70">Issues Fixed</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-3xl font-black text-green-300">{enhanced.improvementScore}%</div>
                  <div className="text-xs text-white/70">Quality Score</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* enhancing loader */}
        {enhancing && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-12 mb-8 text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {jdMode !== 'none' ? 'AI is tailoring your resume to the job…' : 'AI is rewriting your resume…'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {jdMode !== 'none' ? 'Extracting JD keywords, injecting them into your resume, rewriting for this specific role' : 'Analyzing weak phrases, adding action verbs, quantifying achievements'}
            </p>
            <div className="max-w-sm mx-auto space-y-3">
              {(jdMode !== 'none' ? [
                { icon: '🔍', text: 'Extracting keywords from job description' },
                { icon: '🎯', text: 'Matching your skills to JD requirements' },
                { icon: '✍️', text: 'Rewriting summary to mirror JD language' },
                { icon: '💉', text: 'Injecting missing JD keywords into resume' },
              ] : [
                { icon: '🔍', text: 'Scanning for weak language patterns' },
                { icon: '✍️', text: 'Rewriting with strong action verbs' },
                { icon: '📊', text: 'Adding quantifiable achievements' },
                { icon: '🎯', text: 'Injecting ATS keywords for your role' },
              ]).map((s, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.text}</span>
                  <div className="ml-auto w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* no enhancement yet */}
        {!enhanced && !enhancing && (
          <div className="space-y-6">

            {/* ── JD INPUT PANEL (shown when ?jd=1 or user clicks "Enhance with JD") ── */}
            {showJdPanel && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 shadow-lg p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Tailor Resume to Job Description</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AI injects JD keywords, rewrites your summary to match the role, and shows exactly what changed</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowJdPanel(false); setJdMode('none'); setJdText(''); setJdFile(null); }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* mode tabs */}
                <div className="flex gap-3 mb-4">
                  {[
                    { key: 'text', label: '📝 Paste JD Text',  desc: 'Copy-paste the job description' },
                    { key: 'file', label: '📄 Upload JD File', desc: 'PDF, DOCX, or TXT' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setJdMode(opt.key)}
                      className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                        jdMode === opt.key
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {jdMode === 'text' && (
                  <div>
                    <textarea
                      rows={7}
                      value={jdText}
                      onChange={e => setJdText(e.target.value)}
                      placeholder="Paste the full job description here — requirements, responsibilities, preferred skills, tech stack, etc."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {jdText.length} chars{jdText.length > 0 && jdText.length < 50 ? ' — need at least 50' : ''}
                      </span>
                      {jdText.length >= 50 && <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Ready</span>}
                    </div>
                  </div>
                )}

                {jdMode === 'file' && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                    <input type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setJdFile(f); }} />
                    {jdFile ? (
                      <div className="text-center">
                        <div className="text-2xl mb-1">📄</div>
                        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{jdFile.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{(jdFile.size / 1024).toFixed(0)} KB — click to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl mb-1">📎</div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload JD file</p>
                        <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, DOC, or TXT</p>
                      </div>
                    )}
                  </label>
                )}

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleEnhance}
                    disabled={
                      enhancing ||
                      (jdMode === 'text' && jdText.trim().length < 50) ||
                      (jdMode === 'file' && !jdFile) ||
                      jdMode === 'none'
                    }
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <Wand2 className="h-5 w-5" /><span>Enhance with Job Description</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowJdPanel(false);
                      setJdMode('none');
                      setJdText('');
                      setJdFile(null);
                      // forceGeneral=true bypasses stale jdMode state and runs a plain enhance
                      handleEnhance(true);
                    }}
                    className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
                    Skip — General Enhance
                  </button>
                </div>
              </div>
            )}

            {/* ── GENERAL ENHANCE CARD (shown when JD panel is closed) ── */}
            {!showJdPanel && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-12 text-center animate-slide-up">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="h-10 w-10 text-violet-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ready to enhance your resume?</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  AI rewrites every section with stronger language, quantified achievements, and ATS keywords — and shows you exactly what changed.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                  {[
                    { icon: Zap,        label: 'Action Verbs',      color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { icon: TrendingUp, label: 'Quantified Results', color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: Star,       label: 'ATS Keywords',       color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                    { icon: Brain,      label: 'JD Tailoring',       color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                  ].map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col items-center space-y-2`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button onClick={handleEnhance}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all text-lg">
                    <Wand2 className="h-5 w-5" /><span>Enhance My Resume</span>
                  </button>
                  <button onClick={() => { setShowJdPanel(true); setJdMode('text'); }}
                    className="inline-flex items-center space-x-2 px-6 py-4 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl hover:scale-105 transition-all text-base">
                    <Brain className="h-5 w-5" /><span>Enhance with Job Description</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PREVIEW VIEW ── */}
        {enhanced && !enhancing && view === 'preview' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Eye className="h-5 w-5 text-violet-500" /><span>Resume Preview</span>
              </h2>
              <button onClick={() => setView('edit')}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-violet-400 hover:text-violet-600 transition-all text-sm">
                <Edit3 className="h-4 w-4" /><span>Edit Resume</span>
              </button>
            </div>
            <ResumePreview sections={sections} resume={resume} />
          </div>
        )}

        {/* ── EDIT VIEW ── */}
        {enhanced && !enhancing && view === 'edit' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-violet-500" /><span>Edit Enhanced Resume</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={() => setView('preview')}
                  className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-violet-400 hover:text-violet-600 transition-all text-sm">
                  <Eye className="h-4 w-4" /><span>Preview</span>
                </button>
                <button onClick={handleSaveEdits}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm">
                  <Save className="h-4 w-4" /><span>{saved ? '✓ Saved!' : 'Save & Preview'}</span>
                </button>
              </div>
            </div>
            <EditPanel sections={editSections || {}} onChange={setEditSections} />
          </div>
        )}

        {/* ── SECTIONS VIEW ── */}
        {enhanced && !enhancing && view === 'sections' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* LEFT: section tabs */}
            <div className="xl:col-span-3 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden animate-slide-up">
                <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 px-4 pt-4 gap-1 pb-0">
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-b-2 border-violet-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}>{tab.label}</button>
                  ))}
                </div>
                <div className="p-6">
                  {activeTab === 'summary' && sections.summary && (
                    <div className="animate-fade-in">
                      <div className="flex items-center space-x-2 mb-4"><Sparkles className="h-5 w-5 text-violet-500" /><h3 className="font-bold text-gray-900 dark:text-white">Enhanced Professional Summary</h3></div>
                      <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{sections.summary}</p>
                      </div>
                      {enhanced.summary && <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-sm text-gray-600 dark:text-gray-400 italic">{enhanced.summary}</p></div>}
                    </div>
                  )}
                  {activeTab === 'experience' && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex items-center space-x-2 mb-2"><Zap className="h-5 w-5 text-orange-500" /><h3 className="font-bold text-gray-900 dark:text-white">Enhanced Experience</h3></div>
                      {(sections.experience || []).map((exp, i) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-start justify-between mb-1"><span className="font-bold text-gray-900 dark:text-white">{exp.title}</span><span className="text-xs text-gray-500 dark:text-gray-400">{exp.duration}</span></div>
                          <div className="text-sm text-violet-600 dark:text-violet-400 font-semibold mb-3">{exp.company}</div>
                          <ul className="space-y-2">{(exp.bullets || []).map((b, j) => (<li key={j} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /><span>{b.replace(/^[•\-]\s*/, '')}</span></li>))}</ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'projects' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center space-x-2 mb-2"><Brain className="h-5 w-5 text-blue-500" /><h3 className="font-bold text-gray-900 dark:text-white">Enhanced Projects</h3></div>
                      {(sections.projects || []).map((p, i) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-start justify-between mb-1"><span className="font-bold text-gray-900 dark:text-white">{p.name}</span>{p.technologies && <span className="text-xs text-violet-600 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">{p.technologies}</span>}</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'skills' && (
                    <div className="animate-fade-in">
                      <div className="flex items-center space-x-2 mb-4"><Star className="h-5 w-5 text-yellow-500" /><h3 className="font-bold text-gray-900 dark:text-white">Reorganized Skills</h3></div>
                      <div className="space-y-3">{Object.entries(sections.skills || {}).map(([cat, list]) => Array.isArray(list) && list.length > 0 ? (<div key={cat} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700"><div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">{cat}</div><div className="flex flex-wrap gap-2">{list.map((s, i) => (<span key={i} className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">{s}</span>))}</div></div>) : null)}</div>
                    </div>
                  )}
                  {activeTab === 'education' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center space-x-2 mb-2"><TrendingUp className="h-5 w-5 text-green-500" /><h3 className="font-bold text-gray-900 dark:text-white">Education</h3></div>
                      {(sections.education || []).map((e, i) => (<div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700"><div className="flex items-start justify-between"><span className="font-bold text-gray-900 dark:text-white">{e.degree}</span><span className="text-xs text-gray-500 dark:text-gray-400">{e.year}</span></div><div className="text-sm text-violet-600 dark:text-violet-400 font-medium mt-1">{e.institution}{e.gpa ? ` — GPA: ${e.gpa}` : ''}</div></div>))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: JD keywords + mistakes */}
            <div className="xl:col-span-2 space-y-4">

              {/* JD keywords panel — only shown when tailored */}
              {isTailored && (jdAdded.length > 0 || jdMissing.length > 0) && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-card overflow-hidden animate-slide-up">
                  <div className="p-4 border-b border-indigo-100 dark:border-indigo-800 flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/20">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-200">JD Keyword Analysis</h3>
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full">🎯 Tailored</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {jdAdded.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                          <CheckCircle className="h-3.5 w-3.5" /><span>Keywords Injected ({jdAdded.length})</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {jdAdded.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full text-xs font-medium">
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {jdMissing.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                          <XCircle className="h-3.5 w-3.5" /><span>Genuine Skill Gaps ({jdMissing.length})</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {jdMissing.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-full text-xs font-medium">
                              ✗ {kw}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">These skills are required by the JD but not found in your resume. Consider adding them if you have experience.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 animate-slide-up">
                {[
                  { label: 'High',   count: highCount,   color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      filter: 'high'   },
                  { label: 'Medium', count: mediumCount, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', filter: 'medium' },
                  { label: 'Low',    count: lowCount,    color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20',     filter: 'low'    },
                ].map(({ label, count, color, bg, filter }) => (
                  <button key={label} onClick={() => setFilterSev(filterSev === filter ? 'all' : filter)}
                    className={`${bg} rounded-2xl p-3 text-center transition-all hover:scale-105 ${filterSev === filter ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                    <div className={`text-2xl font-black ${color}`}>{count}</div>
                    <div className={`text-xs font-semibold ${color}`}>{label}</div>
                  </button>
                ))}
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">{mistakes.length} Issue{mistakes.length !== 1 ? 's' : ''} Found</h3>
                  </div>
                  {filterSev !== 'all' && <button onClick={() => setFilterSev('all')} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">Show all</button>}
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {mistakes.length === 0
                    ? <div className="text-center py-8 text-gray-500 dark:text-gray-400"><CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" /><p className="text-sm font-medium">No issues found</p></div>
                    : mistakes.map((m, i) => <MistakeCard key={i} mistake={m} index={i} />)}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
