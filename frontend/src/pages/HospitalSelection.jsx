import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { auth } from '../config/firebase';

const STATUS_CONFIG = {
  Critical: {
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    ring: 'hover:border-red-400 dark:hover:border-red-600',
    glow: 'hover:shadow-red-100 dark:hover:shadow-red-900/30',
  },
  High: {
    badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    ring: 'hover:border-orange-400 dark:hover:border-orange-600',
    glow: 'hover:shadow-orange-100 dark:hover:shadow-orange-900/30',
  },
  Moderate: {
    badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    ring: 'hover:border-yellow-400 dark:hover:border-yellow-600',
    glow: 'hover:shadow-yellow-100 dark:hover:shadow-yellow-900/30',
  },
  Low: {
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    ring: 'hover:border-green-400 dark:hover:border-green-600',
    glow: 'hover:shadow-green-100 dark:hover:shadow-green-900/30',
  },
  Normal: {
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    ring: 'hover:border-green-400 dark:hover:border-green-600',
    glow: 'hover:shadow-green-100 dark:hover:shadow-green-900/30',
  },
};

export default function HospitalSelection({ isDarkMode, setIsDarkMode }) {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRole = localStorage.getItem('hs_role') || 'Doctor';

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await axiosInstance.get('/api/hospitals');
        setHospitals(res.data);
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  const handleSelectHospital = async (hospitalId) => {
    setSelecting(hospitalId);
    
    try {
      await axiosInstance.post('/api/auth/select-hospital', { hospitalId });
      
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        localStorage.setItem('hs_token', token);
      }
      
      localStorage.setItem('selectedHospitalId', hospitalId);
      
      setTimeout(() => {
        if (userRole === 'Nurse') {
          navigate('/intake');
        } else {
          navigate('/dashboard');
        }
      }, 250);

    } catch (err) {
      console.error("Failed to select hospital:", err);
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img src="/nav_logo.png" alt="HealthSync" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block', filter: isDarkMode ? 'invert(1)' : 'none' }} />
        </div>

        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {userRole}
          </span>

          {/* Dark-mode toggle */}
          {setIsDarkMode && (
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {/* ── Hero text ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-10 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0d6efd] mb-3">
            Shift Assignment
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-3">
            Select Your Facility
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Choose the hospital you are assigned to for this shift. Your session will be scoped to
            the selected location.
          </p>
        </div>

        {/* ── Hospital cards ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {loading ? (
            <div className="col-span-full text-center text-slate-500">Loading facilities...</div>
          ) : (
            hospitals.map((hospital) => {
              const cfg = STATUS_CONFIG[hospital.capacity] || STATUS_CONFIG.Normal;
              const isLoading = selecting === hospital._id;
              
              const iconMap = {
                'City General Hospital': 'local_hospital',
                'Northside Clinic': 'emergency',
                "St. Jude's Medical Institute": 'medical_services'
              };
              const iconName = iconMap[hospital.name] || 'local_hospital';

              return (
                <button
                  key={hospital._id}
                  id={`hospital-card-${hospital._id}`}
                  onClick={() => handleSelectHospital(hospital._id)}
                  disabled={!!selecting}
                  className={[
                    'group relative flex flex-col text-left p-6 rounded-2xl border transition-all duration-200',
                    'bg-white dark:bg-gray-800',
                    'border-gray-200 dark:border-gray-700',
                    cfg.ring,
                    'hover:-translate-y-1 hover:shadow-xl',
                    cfg.glow,
                    'focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/50',
                    'disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0',
                    isLoading ? 'scale-[0.98] opacity-80' : '',
                  ].join(' ')}
                >
                  {/* Icon + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-[#0d6efd] text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {iconName}
                      </span>
                    </div>

                    <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                      {hospital.capacity}
                    </span>
                  </div>

                  {/* Name & district */}
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#0d6efd] transition-colors">
                    {hospital.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    📍 {hospital.location?.city || hospital.location?.address || 'Unknown'}
                  </p>

                  {/* Beds available */}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {hospital.availableBeds} beds available
                    </span>

                    {/* CTA */}
                    <span className={[
                      'inline-flex items-center gap-1 text-xs font-semibold text-[#0d6efd] transition-all',
                      'group-hover:gap-2',
                    ].join(' ')}>
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">
                            progress_activity
                          </span>
                          Connecting…
                        </>
                      ) : (
                        <>
                          Connect
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Subtle bottom-border accent on hover */}
                  <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-[#0d6efd]/0 group-hover:bg-[#0d6efd]/40 transition-all duration-300" />
                </button>
              );
            })
          )}
        </div>

        {/* ── Footer note ─────────────────────────────────────── */}
        <p className="mt-10 text-xs text-slate-400 dark:text-slate-600 text-center max-w-sm">
          Your selection is securely bound to your session. You can switch facilities by logging
          out and signing back in.
        </p>
      </main>
    </div>
  );
}





