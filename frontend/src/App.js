import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProfileForm from './components/ProfileForm';
import ResumeBuilder from './components/ResumeBuilder';
import JobListing from './components/JobListing';
import CertificationForm from './components/CertificationForm';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import CareerGuide from './components/CareerGuide';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfileForm />} />
                <Route path="/resume" element={<ResumeBuilder />} />
                <Route path="/jobs" element={<JobListing />} />
                <Route path="/certifications" element={<CertificationForm />} />
                <Route path="/career-guide" element={<CareerGuide />} />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}export default App;
