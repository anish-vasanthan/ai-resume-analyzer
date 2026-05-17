import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../services/api';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Loader, Sparkles, Zap, Brain, Target, X
} from 'lucide-react';

const steps = [
  { icon: FileText, label: 'Parse Resume',       desc: 'Extract text and structure' },
  { icon: Brain,    label: 'AI Analysis',         desc: 'Analyze content with GPT-4o' },
  { icon: Target,   label: 'ATS Scoring',         desc: 'Calculate compatibility score' },
  { icon: Sparkles, label: 'Generate Insights',   desc: 'Create personalized feedback' },
];

export default function UploadResume() {
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep]         = useState(-1);
  const [error, setError]       = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };

  const handleFile = (f) => {
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!valid.includes(f.type)) { setError('Only PDF or DOCX files are allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
    setFile(f); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to upload a resume. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setUploading(true); setError('');

    // Simulate step progression
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }

    try {
      const response = await uploadResume(file);
      navigate(`/resume/${response.data._id || response.data.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      setUploading(false); 
      setStep(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full text-green-700 dark:text-green-400 text-sm font-bold mb-4 border border-green-200 dark:border-green-800">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>AI-Powered Analysis</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Upload Your Resume</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Get instant AI feedback, ATS score, and personalized improvement suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upload area */}
          <div className="lg:col-span-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8">

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm flex-1">{error}</span>
                  <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
                </div>
              )}

              {uploading ? (
                /* Progress view */
                <div className="py-8">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-green-500/30">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analyzing your resume...</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">This takes about 2-3 seconds</p>
                  </div>
                  <div className="space-y-3">
                    {steps.map((s, i) => {
                      const Icon = s.icon;
                      const done    = i < step;
                      const active  = i === step;
                      return (
                        <div key={i} className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-500 ${
                          active ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                          : done  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : 'bg-gray-50 dark:bg-gray-800/50 opacity-50'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            active ? 'bg-gradient-to-br from-green-500 to-emerald-600' : done ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {active
                              ? <Loader className="h-5 w-5 text-white animate-spin" />
                              : done
                              ? <CheckCircle className="h-5 w-5 text-white" />
                              : <Icon className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${active ? 'text-green-700 dark:text-green-300' : done ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}`}>
                              {s.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
                          </div>
                          {active && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Drop zone */}
                  <div
                    onDragEnter={handleDrag} onDragLeave={handleDrag}
                    onDragOver={handleDrag} onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
                      dragActive
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
                        : file
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                    }`}
                  >
                    <input type="file" id="file-upload" className="hidden"
                      accept=".pdf,.docx" onChange={handleChange} />

                    {file ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <div className="flex items-center space-x-2 mt-3 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Ready to analyze</span>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 animate-float">
                          <Upload className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Drop your resume here</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          or <span className="text-green-600 font-bold">browse files</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-3">PDF or DOCX · Max 5MB</p>
                      </label>
                    )}
                  </div>

                  <div className="mt-6 flex items-center space-x-3">
                    {file && (
                      <button type="button" onClick={() => setFile(null)}
                        className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                        Change File
                      </button>
                    )}
                    <button type="submit" disabled={!file}
                      className={`flex-1 py-3 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                        file
                          ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      }`}>
                      <Zap className="h-5 w-5" />
                      <span>Analyze with AI</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* What you'll get */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">What you'll get</h3>
            {[
              { icon: Target,   color: 'from-green-500 to-emerald-600',  title: 'ATS Score',          desc: 'See how well your resume passes automated screening systems' },
              { icon: Brain,    color: 'from-emerald-500 to-teal-600',   title: 'AI Analysis',         desc: 'Detailed strengths, weaknesses, and missing keywords' },
              { icon: Sparkles, color: 'from-teal-500 to-cyan-600',      title: 'Self Introduction',   desc: 'AI-generated professional introduction tailored to your profile' },
              { icon: Zap,      color: 'from-cyan-500 to-blue-600',      title: 'Interview Questions', desc: 'Role-specific technical, HR, and scenario questions' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card-hover bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-card flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
