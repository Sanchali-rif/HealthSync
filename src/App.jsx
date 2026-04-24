import React, { useState, useEffect } from 'react';
import PatientIntake from './pages/PatientIntake';
import LiveDashboard from './pages/LiveDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('patient-intake');
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

  return (
    <>
      {currentPage === 'patient-intake' ? (
        <PatientIntake setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      ) : (
        <LiveDashboard setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      )}
    </>
  );
}

export default App;
