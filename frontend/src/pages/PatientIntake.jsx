import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { API_ROUTES } from '../config/api';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const priorityDisplayLabel = {
  1: 'Critical',
  2: 'Urgent',
  3: 'Moderate',
  4: 'Non-Urgent',
};

const priorityConfig = {
  1: {
    bg: 'bg-status-critical-bg dark:bg-[#450a0a]',
    border: 'border-status-critical-text/30 dark:border-[#7f1d1d]',
    text: 'text-status-critical-text dark:text-white',
    badgeBg: 'bg-status-critical-text dark:bg-white',
    badgeText: 'text-white dark:text-[#991b1b]',
    icon: 'warning',
  },
  2: {
    bg: 'bg-status-urgent-bg dark:bg-[#431407]',
    border: 'border-status-urgent-text/30 dark:border-orange-900',
    text: 'text-status-urgent-text dark:text-orange-300',
    badgeBg: 'bg-status-urgent-text dark:bg-orange-500',
    badgeText: 'text-white dark:text-black',
    icon: 'priority_high',
  },
  3: {
    bg: 'bg-status-priority-bg dark:bg-blue-900/30',
    border: 'border-status-priority-text/30 dark:border-blue-900',
    text: 'text-status-priority-text dark:text-blue-300',
    badgeBg: 'bg-status-priority-text dark:bg-blue-500',
    badgeText: 'text-white dark:text-black',
    icon: 'info',
  },
  4: {
    bg: 'bg-status-non-urgent-bg dark:bg-green-900/30',
    border: 'border-status-non-urgent-text/30 dark:border-green-900',
    text: 'text-status-non-urgent-text dark:text-green-300',
    badgeBg: 'bg-status-non-urgent-text dark:bg-green-500',
    badgeText: 'text-white dark:text-black',
    icon: 'check_circle',
  },
};

export default function PatientIntake({ isDarkMode, setIsDarkMode }) {
  const navigate = useNavigate();
  const [triageResult, setTriageResult] = useState(null);

  // Controlled form state — survives dark mode re-renders
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    age: '',
    gender: '',
    arrival: '',
    hr: '100',
    bp: '120/80',
    temp: '37.2',
    spo2: '95',
    complaint: '',
  });

  const setField = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleLogout = async () => {
    try {
      localStorage.removeItem('hs_token');
      localStorage.removeItem('hs_refresh');
      localStorage.removeItem('hs_role');
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };
  const role = localStorage.getItem('hs_role');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTriageResult(null);

    try {
      const payload = {
        patientId: formData.patientId,
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        complaint: formData.complaint,
        vitals: {
          hr: Number(formData.hr),
          bp: formData.bp,
          temp: Number(formData.temp),
          spo2: Number(formData.spo2),
        },
      };

      const response = await axiosInstance.post(API_ROUTES.triage, payload);
      setTriageResult(response.data.aiTriage);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTriageResult(null);
    setError('');
    setFormData({
      patientId: '',
      name: '',
      age: '',
      gender: '',
      arrival: '',
      hr: '100',
      bp: '120/80',
      temp: '37.2',
      spo2: '95',
      complaint: '',
    });
  };

  const cfg = triageResult ? priorityConfig[triageResult.priorityLevel] || priorityConfig[4] : null;

  return (
    <div className="bg-background dark:bg-slate-900 text-on-background dark:text-slate-50 font-body-sm min-h-screen">
      {/* TopNavBar */}
      <header className="bg-white dark:bg-slate-900 font-sans Inter text-sm antialiased docked full-width top-0 z-50 h-14 border-b border-slate-200 dark:border-slate-800 flat no shadows flex justify-between items-center w-full px-6 hidden md:flex">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-slate-50" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">HealthSync</span>
        </div>
        <nav className="flex space-x-6 h-full items-end">
          {role === 'Nurse' && (
            <a
              className="text-slate-900 dark:text-slate-50 font-bold border-b-2 border-slate-900 dark:border-slate-50 pb-[17px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70"
              onClick={(e) => e.preventDefault()}
              href="#"
            >
              Patient Intake
            </a>
          )}
          {role === 'Doctor' && (
            <a
              className="text-slate-500 dark:text-slate-400 font-medium pb-[17px] mt-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 font-body-sm text-body-sm"
              onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
              href="#"
            >
              Live Dashboard
            </a>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-status-non-urgent-bg dark:bg-[#14532d]/40 rounded-DEFAULT border border-status-non-urgent-text border-opacity-20 dark:border-green-600">
            <div className="w-2 h-2 rounded-full bg-status-non-urgent-text dark:bg-green-500 animate-pulse"></div>
            <span className="font-label-caps text-status-non-urgent-text dark:text-green-500">LIVE</span>
          </div>
          <button
            className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
          <button 
            className="text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT"
            onClick={handleLogout}
            title="Sign Out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 flex justify-around py-3">
        {role === 'Nurse' && (
          <a className="flex flex-col items-center text-primary" onClick={(e) => e.preventDefault()} href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <span className="text-[10px] font-semibold mt-1">Intake</span>
          </a>
        )}
        {role === 'Doctor' && (
          <a className="flex flex-col items-center text-slate-500" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </a>
        )}
      </nav>

      {/* Main Content Canvas */}
      <main className="p-container-padding max-w-5xl mx-auto space-y-grid-gutter pb-24 md:pb-container-padding mt-14 md:mt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Emergency Room Triage</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300">Log patient arrival and compute initial severity.</p>
          </div>
          <div className="font-data-tabular text-data-tabular text-on-surface-variant dark:text-slate-300 bg-surface-container dark:bg-slate-800 px-3 py-1.5 rounded-DEFAULT border border-outline-variant dark:border-slate-700 flex items-center gap-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-colors">
            <span>ID:</span>
            <input 
              value={formData.patientId}
              onChange={setField('patientId')}
              type="text" 
              placeholder="_____" 
              className="bg-transparent border-none outline-none w-24 text-on-surface dark:text-white placeholder-slate-400 font-data-tabular p-0 m-0" 
              required
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter">
            {/* Left Column: Form */}
            <div className="lg:col-span-8 space-y-grid-gutter">
              {/* Section A: Patient Info */}
              <section className="bg-surface-container-lowest dark:bg-slate-800 rounded-DEFAULT border border-border-light dark:border-slate-700 p-4 shadow-sm">
                <h2 className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Patient Identity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">Full Name</label>
                    <input value={formData.name} onChange={setField('name')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" type="text" placeholder="Enter full name" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">Age</label>
                      <input value={formData.age} onChange={setField('age')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" type="number" placeholder="e.g. 54" required />
                    </div>
                    <div>
                      <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">Gender</label>
                      <select value={formData.gender} onChange={setField('gender')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none" required>
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">Arrival Time</label>
                    <input value={formData.arrival} onChange={setField('arrival')} className="w-full md:w-1/2 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" type="time" required />
                  </div>
                </div>
              </section>

              {/* Section B: Vitals */}
              <section className="bg-surface-container-lowest dark:bg-slate-800 rounded-DEFAULT border border-border-light dark:border-slate-700 p-4 shadow-sm">
                <h2 className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                  Vitals
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">HR (bpm)</label>
                    <input value={formData.hr} onChange={setField('hr')} className="w-full bg-status-urgent-bg dark:bg-[#431407] border border-status-urgent-text border-opacity-30 dark:border-orange-700/50 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-status-urgent-text dark:text-orange-400 font-bold focus:outline-none focus:border-primary transition-colors" type="number" required />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">BP (mmHg)</label>
                    <input value={formData.bp} onChange={setField('bp')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary transition-colors" type="text" required />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">Temp (°C)</label>
                    <input value={formData.temp} onChange={setField('temp')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary transition-colors" step="0.1" type="number" required />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 mb-1">SpO2 (%)</label>
                    <input value={formData.spo2} onChange={setField('spo2')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface dark:text-white focus:outline-none focus:border-primary transition-colors" type="number" required />
                  </div>
                </div>
              </section>

              {/* Section C: Chief Complaint */}
              <section className="bg-surface-container-lowest dark:bg-slate-800 rounded-DEFAULT border border-border-light dark:border-slate-700 p-4 shadow-sm">
                <h2 className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Chief Complaint
                </h2>
                <textarea value={formData.complaint} onChange={setField('complaint')} className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-600 rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm text-on-surface dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" rows="4" placeholder="Describe patient symptoms and chief complaint..." required></textarea>
              </section>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-DEFAULT px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary dark:bg-blue-400 text-on-primary dark:text-black font-headline-md text-headline-md py-3 px-4 rounded-DEFAULT hover:bg-surface-tint dark:hover:bg-blue-500 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Running AI Triage...
                  </>
                ) : (
                  <>
                    Submit and triage patient
                    <span className="material-symbols-outlined dark:text-black">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: AI Triage Result */}
            <div className="lg:col-span-4">
              {triageResult && cfg ? (
                <div className={`${cfg.bg} border ${cfg.border} rounded-DEFAULT p-4 sticky top-20 shadow-sm`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${cfg.text} text-[24px]`}>{cfg.icon}</span>
                    <div className="w-full">
                      <h3 className={`font-headline-md text-headline-md ${cfg.text} mb-1`}>{priorityDisplayLabel[triageResult.priorityLevel] || triageResult.priorityLabel} Priority</h3>
                      <p className="font-body-sm text-body-sm text-on-surface dark:text-slate-200 mb-3">{triageResult.justification}</p>

                      <div className="space-y-2">
                        <div className="bg-white bg-opacity-50 dark:bg-slate-900 dark:bg-opacity-100 px-3 py-2 rounded-DEFAULT border border-opacity-20 flex justify-between items-center">
                          <span className={`font-label-caps text-label-caps ${cfg.text} uppercase`}>Primary Flag</span>
                          <span className={`font-data-tabular text-data-tabular ${cfg.text} font-bold`}>{triageResult.department}</span>
                        </div>
                        <div className="bg-white bg-opacity-50 dark:bg-slate-900 dark:bg-opacity-100 px-3 py-2 rounded-DEFAULT border border-opacity-20 flex justify-between items-center">
                          <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-300 uppercase">ESI Level</span>
                          <span className="font-data-tabular text-data-tabular text-on-surface dark:text-white font-bold">Level {triageResult.priorityLevel}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={resetForm}
                        className={`mt-4 w-full ${cfg.badgeBg} ${cfg.badgeText} font-data-tabular text-data-tabular py-2 px-4 rounded-DEFAULT hover:opacity-90 transition-colors font-bold uppercase`}
                      >
                        Submit Another Patient
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-status-critical-bg dark:bg-[#450a0a] border border-status-critical-text border-opacity-30 dark:border-[#7f1d1d] rounded-DEFAULT p-4 sticky top-20 shadow-sm opacity-40">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-status-critical-text dark:text-white text-[24px]">warning</span>
                    <div className="w-full">
                      <h3 className="font-headline-md text-headline-md text-status-critical-text dark:text-white mb-1">AI Triage Result</h3>
                      <p className="font-body-sm text-body-sm text-on-surface dark:text-slate-200 mb-3">Submit patient data to receive an AI-generated triage assessment.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
