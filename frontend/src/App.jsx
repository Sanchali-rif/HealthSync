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
import HospitalSelection from './pages/HospitalSelection';
import LoadingScreen from './pages/LoadingScreen';

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

// Minimum ms the loading screen is visible regardless of Firebase speed
const MIN_LOADING_MS = 2800;

function App() {
  const [authChecked, setAuthChecked]       = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [fadeOut, setFadeOut]               = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Dark-mode side-effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Minimum display timer
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  // Firebase auth listener
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

  // Trigger fade-out once both conditions are satisfied
  const bothReady = authChecked && minTimeElapsed;

  useEffect(() => {
    if (bothReady) {
      const fadeTimer = setTimeout(() => setFadeOut(true), 100);
      return () => clearTimeout(fadeTimer);
    }
  }, [bothReady]);

  // Show loading screen until fade-out animation completes (~500 ms)
  if (!bothReady || !fadeOut) {
    return (
      <div
        style={{
          transition: 'opacity 0.5s ease',
          opacity: fadeOut ? 0 : 1,
          pointerEvents: fadeOut ? 'none' : 'auto',
        }}
      >
        <LoadingScreen />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/forgot-password" element={<ForgotPassword isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/reset-password" element={<ResetPassword isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        <Route path="/select-hospital" element={
          <SharedRoute>
            <HospitalSelection isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </SharedRoute>
        } />
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
