import React from 'react';
import { auth } from '../config/firebase';

function Unauthorized({ setCurrentPage, isDarkMode }) {
  const handleGoBack = async () => {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_role');
    await auth.signOut();
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-md w-full px-6 py-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>

        <h2 className="text-[32px] font-bold text-gray-900 dark:text-white mb-3">
          Access Denied
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
          You do not have permission to view this page.
        </p>

        <button
          onClick={handleGoBack}
          className="w-full py-3 px-4 bg-[#0d6efd] hover:bg-blue-700 text-white font-medium focus:outline-none transition-colors"
        >
          Go back to login
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;
