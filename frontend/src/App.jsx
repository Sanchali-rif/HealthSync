import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import PatientIntake from './pages/PatientIntake';
import LiveDashboard from './pages/LiveDashboard';
import Login from './pages/Login';

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
        if (role === 'doctor') {
          setCurrentPage('live-dashboard');
        } else {
          setCurrentPage('patient-intake'); // default for nurses
        }
      } else {
        // No user — always show login
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

  return (
    <>
      {currentPage === 'login' ? (
        <Login isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      ) : currentPage === 'patient-intake' ? (
        <PatientIntake setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      ) : (
        <LiveDashboard setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      )}
    </>
  );
}

export default App;
