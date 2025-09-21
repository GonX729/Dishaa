import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Profile API
export const profileAPI = {
  // Get user profile
  getProfile: (userId) => api.get(`/profile/${userId}`),
  
  // Update profile
  updateProfile: (userId, profileData) => {
    const formData = new FormData();
    
    // Handle file uploads
    if (profileData.resume) {
      formData.append('resume', profileData.resume);
      delete profileData.resume;
    }
    
    // Handle regular fields
    Object.keys(profileData).forEach(key => {
      if (Array.isArray(profileData[key])) {
        profileData[key].forEach(item => {
          if (typeof item === 'object') {
            formData.append(`${key}[]`, JSON.stringify(item));
          } else {
            formData.append(`${key}[]`, item);
          }
        });
      } else if (typeof profileData[key] === 'object' && profileData[key] !== null) {
        formData.append(key, JSON.stringify(profileData[key]));
      } else {
        formData.append(key, profileData[key]);
      }
    });
    
    return api.put(`/profile/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Upload resume
  uploadResume: (userId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post(`/profile/${userId}/resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Course API
export const courseAPI = {
  // Get course recommendations
  getRecommendations: (userId, params = {}) => 
    api.get(`/courses/recommendations/${userId}`, { params }),
  
  // Get course details
  getCourse: (courseId) => api.get(`/courses/${courseId}`),
  
  // Search courses
  searchCourses: (params) => api.get('/courses/search', { params }),
  
  // Enroll in course
  enrollCourse: (courseId, userId) => 
    api.post(`/courses/${courseId}/enroll`, { userId }),
  
  // Get enrolled courses
  getEnrolledCourses: (userId) => api.get(`/courses/enrolled/${userId}`),
  
  // Update course progress
  updateProgress: (courseId, userId, progress) =>
    api.put(`/courses/${courseId}/progress`, { userId, progress })
};

// Certification API
export const certificationAPI = {
  // Add certification
  addCertification: (userId, certificationData) => {
    const formData = new FormData();
    
    // Handle file uploads
    if (certificationData.certificationFiles) {
      certificationData.certificationFiles.forEach(file => {
        formData.append('certificationFiles', file);
      });
      delete certificationData.certificationFiles;
    }
    
    // Handle other fields
    Object.keys(certificationData).forEach(key => {
      if (Array.isArray(certificationData[key])) {
        certificationData[key].forEach(item => formData.append(`${key}[]`, item));
      } else {
        formData.append(key, certificationData[key]);
      }
    });
    
    return api.post(`/certifications/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Verify certification
  verifyCertification: (data) => api.post('/certifications/verify', data),
  
  // Get user certifications
  getCertifications: (userId) => api.get(`/certifications/${userId}`),
  
  // Delete certification
  deleteCertification: (userId, certificationId) =>
    api.delete(`/certifications/${userId}/${certificationId}`)
};

// Resume API
export const resumeAPI = {
  // Get resume data
  getResume: (userId) => api.get(`/resume/${userId}`),
  
  // Update resume
  updateResume: (userId, resumeData) => api.put(`/resume/${userId}`, resumeData),
  
  // Generate resume
  generateResume: (userId, options = {}) => 
    api.post(`/resume/${userId}/generate`, options, { responseType: 'blob' }),
  
  // Optimize resume
  optimizeResume: (userId, resumeData) =>
    api.post(`/resume/${userId}/optimize`, resumeData),
  
  // Parse uploaded resume
  parseResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Job API
export const jobAPI = {
  // Search jobs
  searchJobs: (params) => api.get('/jobs/search', { params }),
  
  // Get job recommendations
  getRecommendations: (userId, params = {}) =>
    api.get(`/jobs/recommendations/${userId}`, { params }),
  
  // Get job details
  getJob: (jobId) => api.get(`/jobs/${jobId}`),
  
  // Apply to job
  applyJob: (jobId, applicationData) =>
    api.post(`/jobs/${jobId}/apply`, applicationData),
  
  // Save/unsave job
  saveJob: (userId, jobId) => api.post(`/jobs/saved/${userId}`, { jobId }),
  removeSavedJob: (userId, jobId) => api.delete(`/jobs/saved/${userId}/${jobId}`),
  
  // Get saved jobs
  getSavedJobs: (userId) => api.get(`/jobs/saved/${userId}`),
  
  // Get application history
  getApplications: (userId) => api.get(`/jobs/applications/${userId}`)
};

// Progress API
export const progressAPI = {
  // Get dashboard data
  getDashboard: (userId) => api.get(`/progress/${userId}`),
  
  // Update progress
  updateProgress: (userId, progressData) =>
    api.put(`/progress/${userId}`, progressData),
  
  // Get learning analytics
  getAnalytics: (userId, timeframe = '6months') =>
    api.get(`/progress/${userId}/analytics`, { params: { timeframe } }),
  
  // Add achievement
  addAchievement: (userId, achievementData) =>
    api.post(`/progress/${userId}/achievements`, achievementData)
};

// Career Guide API
export const careerGuideAPI = {
  getGuide: (userId) => api.get(`/career-guide/${userId}`),
  saveGoals: (userId, goals) => api.post(`/progress/${userId}/goals`, { goals })
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Format error messages
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
  
  // Check if response is successful
  isSuccess: (response) => {
    return response.status >= 200 && response.status < 300;
  }
};

export default api;
