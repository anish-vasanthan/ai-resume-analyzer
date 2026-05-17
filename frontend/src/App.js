import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadResume from './pages/UploadResume';
import ResumeDetail from './pages/ResumeDetail';
import InterviewQuestions from './pages/InterviewQuestions';
import MockInterview from './pages/MockInterview';
import MockInterviewDetail from './pages/MockInterviewDetail';
import EnhanceResume from './pages/EnhanceResume';
import JobMatcher from './pages/JobMatcher';
import ProfileSettings from './pages/ProfileSettings';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <AppContent />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/upload" element={<PrivateRoute><UploadResume /></PrivateRoute>} />
        <Route path="/resume/:id" element={<PrivateRoute><ResumeDetail /></PrivateRoute>} />
        <Route path="/interview/:resumeId" element={<PrivateRoute><InterviewQuestions /></PrivateRoute>} />
        <Route path="/mock-interview" element={<PrivateRoute><MockInterview /></PrivateRoute>} />
        <Route path="/mock-interview/:id" element={<PrivateRoute><MockInterviewDetail /></PrivateRoute>} />
        <Route path="/resume/:id/enhance" element={<PrivateRoute><EnhanceResume /></PrivateRoute>} />
        <Route path="/job-matcher" element={<PrivateRoute><JobMatcher /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileSettings /></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
