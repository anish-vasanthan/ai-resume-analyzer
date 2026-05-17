import axios from 'axios';

// TEMPORARY FIX: Hardcoded API URL
const API_BASE_URL = 'http://localhost:5000';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000  // 30s default — Supabase free tier can be slow
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      
      // Handle 401 errors — only redirect if the token itself is rejected
      // (not for other request failures on authenticated routes)
      if (error.response.status === 401) {
        const token = localStorage.getItem('token');
        // Only redirect if the 401 came from an auth/profile endpoint,
        // meaning the token is genuinely expired/invalid
        const url = error.config?.url || '';
        const isAuthCheck = url.includes('/user/profile') || url.includes('/auth/');
        if (isAuthCheck) {
          localStorage.removeItem('token');
          console.error('Session expired. Redirecting to login...');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
        // For other 401s (e.g. avatar upload), just return the error message
        return Promise.reject(new Error(message || 'Authentication required.'));
      }
      
      // Handle server errors with descriptive messages
      if (error.response.status >= 500) {
        console.error('Server error:', message);
        return Promise.reject(new Error(message || 'Server error. Please try again.'));
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response received - network/timeout error
      console.error('Network error:', error.message);
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Connection is slow — please try again in a moment.'));
      }
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    } else {
      // Something else happened
      console.error('Request error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Resume APIs
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  
  const response = await api.post('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

export const getResumes = async () => {
  const response = await api.get('/resume');
  return response.data;
};

export const getResume = async (id) => {
  const response = await api.get(`/resume/${id}`);
  return response.data;
};

export const deleteResume = async (id) => {
  const response = await api.delete(`/resume/${id}`);
  return response.data;
};

// Analysis APIs
export const reanalyzeResume = async (id) => {
  const response = await api.post(`/analysis/reanalyze/${id}`);
  return response.data;
};

export const regenerateIntroduction = async (id) => {
  const response = await api.post(`/analysis/regenerate-intro/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/analysis/stats');
  return response.data;
};

// User Profile APIs
export const updateProfile = async (data) => {
  const response = await api.put('/user/profile', data);
  return response.data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000  // 60s — base64 image write to Supabase can be slow
  });
  return response.data;
};

export const deleteAvatar = async () => {
  const response = await api.delete('/user/avatar');
  return response.data;
};

// Interview APIs
export const getInterviewQuestions = async (resumeId) => {
  const response = await api.get(`/interview/questions/${resumeId}`);
  return response.data;
};

export const getCustomQuestions = async (role, skills) => {
  const response = await api.post('/interview/questions/custom', { role, skills });
  return response.data;
};

// Mock Interview APIs
export const startMockInterview = async (resumeId, role) => {
  const response = await api.post('/mock-interview/start', { resumeId, role });
  return response.data;
};

export const submitAnswer = async (interviewId, questionIndex, answer) => {
  const response = await api.post(`/mock-interview/${interviewId}/answer`, {
    questionIndex,
    answer
  });
  return response.data;
};

export const completeMockInterview = async (interviewId) => {
  const response = await api.post(`/mock-interview/${interviewId}/complete`);
  return response.data;
};

export const getMockInterviews = async () => {
  const response = await api.get('/mock-interview');
  return response.data;
};

export const getMockInterview = async (id) => {
  const response = await api.get(`/mock-interview/${id}`);
  return response.data;
};

export const deleteMockInterview = async (id) => {
  const response = await api.delete(`/mock-interview/${id}`);
  return response.data;
};

// Resume Enhancer APIs
// jobDescription can be: undefined (general), a string (text), or a File object
export const enhanceResume = async (id, jobDescription) => {
  if (jobDescription instanceof File) {
    const formData = new FormData();
    formData.append('jdFile', jobDescription);
    // IMPORTANT: Do NOT set Content-Type manually.
    // Setting 'multipart/form-data' without the boundary breaks multer on the server.
    // Setting it to undefined removes the axios-default 'application/json' so the
    // browser's XHR/Fetch can auto-inject 'multipart/form-data; boundary=...' correctly.
    const response = await api.post(`/enhance/${id}`, formData, {
      headers: { 'Content-Type': undefined },
      timeout: 90000
    });
    return response.data;
  }
  const response = await api.post(`/enhance/${id}`,
    jobDescription ? { jobDescription } : {},
    { timeout: 90000 }
  );
  return response.data;
};

export const getEnhancement = async (id) => {
  const response = await api.get(`/enhance/${id}`);
  return response.data;
};

// Job Match APIs
export const analyzeJobMatch = async (resumeId, jobDescription) => {
  const response = await api.post(`/job-match/${resumeId}`, { jobDescription });
  return response.data;
};

export const analyzeJobMatchFile = async (resumeId, file) => {
  const formData = new FormData();
  formData.append('jdFile', file);
  const response = await api.post(`/job-match/${resumeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getJobMatchResumes = async () => {
  const response = await api.get('/job-match/resumes/list');
  return response.data;
};

export default api;
