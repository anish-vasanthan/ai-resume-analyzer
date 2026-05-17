import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  FileText, Brain, Target, Upload, CheckCircle, ArrowRight,
  Sparkles, Moon, Sun, TrendingUp, Award, Zap, Star, Shield, Rocket
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay, gradient, glow }) => (
  <div
    className={`group relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 border-transparent hover:border-transparent animate-slide-up overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
    style={{ animationDelay: delay }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl`} />
    <div className={`absolute -inset-0.5 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-100 -z-10 blur-sm transition-all duration-500`} />
    <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-3xl -z-10" />
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
      <Icon className="h-8 w-8 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-600 transition-all duration-300">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const StatBadge = ({ icon: Icon, value, label, gradient }) => (
  <div className={`group flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg`}>
    <Icon className="h-8 w-8 mb-2 group-hover:rotate-12 transition-transform duration-300" />
    <div className="text-4xl font-black mb-1">{value}</div>
    <div className="text-sm text-white/80 font-medium text-center">{label}</div>
  </div>
);

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-green-100 dark:border-green-900/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AI Resume Analyzer
              </span>
            </div>
            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 hover:scale-110">
                {isDark
                  ? <Sun className="h-5 w-5 text-yellow-400" />
                  : <Moon className="h-5 w-5 text-green-600" />}
              </button>
              <Link to="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Login
              </Link>
              <Link to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/40 hover:scale-105 transition-all duration-300 text-sm">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-lime-400/15 to-green-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '3s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36">
          <div className="text-center animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-full mb-8 border border-green-200 dark:border-green-800 shadow-sm hover:scale-105 transition-all duration-300 cursor-pointer">
              <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ⚡ Powered by Groq AI — Ultra Fast
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Land Your
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                  Dream Job
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full" />
              </span>
              <br />
              <span className="text-4xl sm:text-5xl lg:text-6xl text-gray-600 dark:text-gray-400 font-bold">with AI Power</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get instant AI-powered resume analysis, personalized mock interviews, and actionable feedback — all in seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register"
                className="group inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 text-lg">
                <Rocket className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                <span>Start Free — No Card Needed</span>
              </Link>
              <Link to="/login"
                className="group inline-flex items-center space-x-3 px-10 py-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold rounded-2xl border-2 border-green-200 dark:border-green-800 hover:border-green-500 hover:shadow-lg hover:scale-105 transition-all duration-300 text-lg">
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500 dark:text-gray-400">
              {['✅ Free Forever', '⚡ 2-3 Second Analysis', '🔒 Secure & Private', '🤖 Groq AI Powered'].map(b => (
                <span key={b} className="font-medium">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBadge icon={TrendingUp} value="95%" label="ATS Compatibility" gradient="from-green-500 to-emerald-600" />
          <StatBadge icon={Award}      value="10K+" label="Resumes Analyzed" gradient="from-emerald-500 to-teal-600" />
          <StatBadge icon={Zap}        value="2s"   label="Analysis Speed"  gradient="from-teal-500 to-cyan-600" />
          <StatBadge icon={Star}       value="4.9★" label="User Rating"     gradient="from-cyan-500 to-blue-600" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-slide-up">
          <span className="inline-block px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold rounded-full mb-4">FEATURES</span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent"> Succeed</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powered by Groq's ultra-fast AI for instant, accurate results.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={FileText} title="ATS Resume Analysis"
            description="Get a unique ATS score, identify strengths & weaknesses, and receive actionable suggestions to beat applicant tracking systems."
            delay="0.1s" gradient="from-green-500 to-emerald-600" />
          <FeatureCard icon={Brain} title="AI Mock Interviews"
            description="Practice with 38+ IT role-specific questions personalized to YOUR resume. Blockchain, Cybersecurity, Cloud, and more."
            delay="0.2s" gradient="from-emerald-500 to-teal-600" />
          <FeatureCard icon={Target} title="Instant AI Feedback"
            description="Get real-time feedback on your answers, self-introduction generator, and career insights — all in under 3 seconds."
            delay="0.3s" gradient="from-teal-500 to-cyan-600" />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-full mb-4">HOW IT WORKS</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              3 Steps to Your
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent"> Dream Career</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-green-400 to-teal-400" />
            {[
              { num: '01', icon: Upload,      title: 'Upload Resume',       desc: 'Drop your PDF or DOCX. Our AI parses it instantly.',                gradient: 'from-green-500 to-emerald-600' },
              { num: '02', icon: Brain,       title: 'AI Analyzes',         desc: 'Groq AI scores your resume and generates personalized insights.',   gradient: 'from-emerald-500 to-teal-600' },
              { num: '03', icon: CheckCircle, title: 'Ace Interviews',      desc: 'Practice with role-specific questions and land the job.',            gradient: 'from-teal-500 to-cyan-600' },
            ].map((step, i) => (
              <div key={i} className="group flex flex-col items-center text-center animate-slide-up hover:scale-105 transition-all duration-300" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl mb-6 group-hover:rotate-6 transition-all duration-500`}>
                  <step.icon className="h-10 w-10 text-white" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-green-400 flex items-center justify-center">
                    <span className="text-xs font-black text-green-600">{step.num}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">38+ IT Roles Covered</h2>
            <p className="text-white/80 mb-8 text-lg">From Blockchain to Cybersecurity — we've got every IT career path covered</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['🔒 Cybersecurity', '⛓️ Blockchain', '☁️ Cloud', '🤖 AI/ML', '💻 Full Stack', '📊 Data Science', '🚀 DevOps', '🌐 Web3', '🎯 Penetration Testing', '🛡️ Security Architect'].map(role => (
                <span key={role} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-semibold cursor-pointer hover:scale-105 transition-all duration-200">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center space-x-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6">
            Ready to
            <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent"> Transform</span>
            <br />Your Career?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of job seekers who landed their dream jobs using our AI-powered platform.
          </p>
          <Link to="/register"
            className="group inline-flex items-center space-x-3 px-12 py-5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 text-xl">
            <Rocket className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>Get Started Free Today</span>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 dark:bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  AI Resume Analyzer
                </span>
              </div>
              <p className="text-gray-400 max-w-xs leading-relaxed">
                AI-powered tools to help you land your dream job faster than ever before.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'FAQ'].map(item => (
                  <li key={item}><Link to="/register" className="text-gray-400 hover:text-green-400 transition-colors text-sm">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Contact', 'Privacy'].map(item => (
                  <li key={item}><Link to="/register" className="text-gray-400 hover:text-green-400 transition-colors text-sm">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} AI Resume Analyzer. All rights reserved.</p>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-gray-500 text-sm">Secure & Private</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
