import React, { useState } from 'react';
import PatientIntake from './pages/PatientIntake';
import LiveDashboard from './pages/LiveDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('patient-intake');

  return (
    <>
      {currentPage === 'patient-intake' ? (
        <PatientIntake setCurrentPage={setCurrentPage} />
      ) : (
        <LiveDashboard setCurrentPage={setCurrentPage} />
      )}
    </>
  );
}

export default App;
