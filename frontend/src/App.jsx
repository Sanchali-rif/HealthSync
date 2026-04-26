import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import PatientIntake from './pages/PatientIntake';
import LiveDashboard from './pages/LiveDashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RegionalCommand from './pages/RegionalCommand';

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        localStorage.removeItem('hs_token');
        localStorage.removeItem('hs_role');
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading HealthSync...</p>
        </div>
      </div>
    );
  }

  const NurseRoute = ({ children }) => {
    const token = localStorage.getItem('hs_token');
    const role  = localStorage.getItem('hs_role');
    if (!token) return <Navigate to="/login" replace />;
    if (role === 'Doctor') return <Navigate to="/dashboard" replace />;
    if (role === 'Nurse') return children;
    return <Navigate to="/login" replace />;
  };

  const DoctorRoute = ({ children }) => {
    const token = localStorage.getItem('hs_token');
    const role  = localStorage.getItem('hs_role');
    if (!token) return <Navigate to="/login" replace />;
    if (role === 'Nurse') return <Navigate to="/intake" replace />;
    if (role === 'Doctor') return children;
    return <Navigate to="/login" replace />;
  };

  const SharedRoute = ({ children }) => {
    const token = localStorage.getItem('hs_token');
    const role  = localStorage.getItem('hs_role');
    if (!token) return <Navigate to="/login" replace />;
    if (role === 'Doctor' || role === 'Nurse') return children;
    return <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/forgot-password" element={<ForgotPassword isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/reset-password" element={<ResetPassword isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/intake" element={
          <NurseRoute>
            <PatientIntake isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </NurseRoute>
        } />
        <Route path="/dashboard" element={
          <DoctorRoute>
            <LiveDashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </DoctorRoute>
        } />
        <Route path="/regional" element={
            <RegionalCommand isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
