import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import PatientIntake from './pages/PatientIntake';
import LiveDashboard from './pages/LiveDashboard';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

function App() {
  const [currentPage, setCurrentPage] = useState(null); // null = loading
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

  // Listen to Firebase auth state — the single source of truth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in — route based on saved role
        const role = localStorage.getItem('hs_role');
        if (role === 'Nurse') {
          setCurrentPage('patient-intake');
        } else if (role === 'Doctor') {
          setCurrentPage('live-dashboard');
        } else {
          // Logged in but no role yet (e.g. new Google user mid-flow)
          setCurrentPage('login');
        }
      } else {
        // No user — clear any stale session data and show login
        localStorage.removeItem('hs_token');
        localStorage.removeItem('hs_role');
        setCurrentPage('login');
      }
    });

    return () => unsubscribe();
  }, []);

  // Show a loading screen while Firebase checks auth state
  if (currentPage === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading HealthSync...</p>
        </div>
      </div>
    );
  }

  // ─── Role-based guards ──────────────────────────────────────────────────────
  // NurseRoute: only Nurses may view PatientIntake
  const NurseRoute = ({ children }) => {
    const token = localStorage.getItem('hs_token');
    const role  = localStorage.getItem('hs_role');
    if (!token) {
      setCurrentPage('login');
      return null;
    }
    if (role !== 'Nurse') {
      return <Unauthorized setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
    }
    return children;
  };

  // DoctorRoute: only Doctors may view LiveDashboard
  const DoctorRoute = ({ children }) => {
    const token = localStorage.getItem('hs_token');
    const role  = localStorage.getItem('hs_role');
    if (!token) {
      setCurrentPage('login');
      return null;
    }
    if (role !== 'Doctor') {
      return <Unauthorized setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
    }
    return children;
  };

  return (
    <>
      {currentPage === 'login' && (
        <Login
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          setCurrentPage={setCurrentPage}
        />
      )}

      {currentPage === 'patient-intake' && (
        <NurseRoute>
          <PatientIntake
            setCurrentPage={setCurrentPage}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        </NurseRoute>
      )}

      {currentPage === 'live-dashboard' && (
        <DoctorRoute>
          <LiveDashboard
            setCurrentPage={setCurrentPage}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        </DoctorRoute>
      )}

      {currentPage === 'unauthorized' && (
        <Unauthorized
          setCurrentPage={setCurrentPage}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
}

export default App;
