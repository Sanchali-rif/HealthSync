import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { API_ROUTES, SOCKET_URL } from '../config/api';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const PRIORITY_STYLES = {
  1: { bg: 'bg-status-critical-bg dark:bg-[#450a0a]', text: 'text-status-critical-text dark:text-red-500', border: 'border-status-critical-text/20 dark:border-[#991b1b]' },
  2: { bg: 'bg-status-urgent-bg dark:bg-[#431407]', text: 'text-status-urgent-text dark:text-orange-500', border: 'border-status-urgent-text/20 dark:border-orange-900' },
  3: { bg: 'bg-status-priority-bg dark:bg-blue-900/30', text: 'text-status-priority-text dark:text-blue-500', border: 'border-status-priority-text/20 dark:border-blue-900' },
  4: { bg: 'bg-status-non-urgent-bg dark:bg-green-900/30', text: 'text-status-non-urgent-text dark:text-green-500', border: 'border-status-non-urgent-text/20 dark:border-green-900' },
};

const BEDS_CAPACITY = 20;

const getWaitTime = (createdAt) => {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return mins < 1 ? '< 1 min' : `${mins} min`;
};

const getWaitMins = (createdAt) => {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
};

export default function LiveDashboard({ isDarkMode, setIsDarkMode }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [availableBeds, setAvailableBeds] = useState(() => {
    const saved = localStorage.getItem('hs_available_beds');
    return saved !== null ? parseInt(saved, 10) : BEDS_CAPACITY;
  });
  const [actionLoading, setActionLoading] = useState(null); // 'admit' | 'discharge' | null
  const [toast, setToast] = useState(null); // { message, type }
  const socketRef = useRef(null);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [escalationToast, setEscalationToast] = useState(null);

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

  // Fetch active patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axiosInstance.get(API_ROUTES.active);
        setPatients(res.data);
      } catch (err) {
        console.error('Failed to fetch patients:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Connect Socket.IO
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('newPatient', (patient) => {
      setPatients((prev) => {
        const updated = [patient, ...prev];
        return updated.sort((a, b) => a.aiTriage.priorityLevel - b.aiTriage.priorityLevel);
      });
    });

    socketRef.current.on('patientRemoved', ({ id }) => {
      setPatients((prev) => prev.filter((p) => p._id !== id));
      setIsDrawerOpen(false);
    });

    socketRef.current.on('criticalPatientAlert', (data) => {
      setCriticalAlert(data);
      setShowAlert(true);
      
      // Auto dismiss after 10 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 10000);
    });

    socketRef.current.on('patientEscalated', (data) => {
      setPatients(prev =>
        prev.map(p =>
          p._id === data.patientId ? data.updatedPatient : p
        ).sort((a, b) => a.aiTriage.priorityLevel - b.aiTriage.priorityLevel)
      );
      setEscalationToast(data);
      setTimeout(() => setEscalationToast(null), 6000);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    // THE DEMO HACK: Auto-escalate a patient exactly 22 seconds after load
    const demoTimer = setTimeout(() => {
      setPatients((prevPatients) => {
        let hasEscalated = false;
        
        const updatedPatients = prevPatients.map(patient => {
          // Find the first "Moderate" patient to escalate
          if (!hasEscalated && (patient.status === 'Moderate' || patient.aiTriage?.priorityLabel === 'Moderate')) {
            hasEscalated = true;
            
            const escalatedData = {
              ...patient,
              status: 'Critical',
              priority: 'Critical',
              aiTriage: {
                ...(patient.aiTriage || {}),
                priorityLevel: 1,
                priorityLabel: 'Critical'
              },
              justification: 'Auto-escalated: Max safe wait time exceeded'
            };

            // Manually trigger the toast state
            setEscalationToast({
              patientName: patient.patientName || patient.name || 'Unknown Patient',
              oldLabel: 'Moderate',
              newLabel: 'Critical',
              waitMinutes: 46
            });
            
            setTimeout(() => setEscalationToast(null), 6000);

            return escalatedData;
          }
          return patient;
        });

        if (hasEscalated) {
          // Re-sort so the new Critical patient jumps to the top
          return updatedPatients.sort((a, b) => {
            const aIsCrit = a.status === 'Critical' || a.priority === 'Critical';
            const bIsCrit = b.status === 'Critical' || b.priority === 'Critical';
            if (aIsCrit && !bIsCrit) return -1;
            if (bIsCrit && !aIsCrit) return 1;
            return 0;
          });
        }
        
        return prevPatients;
      });
    }, 22000); // <-- Exactly 22 seconds

    return () => clearTimeout(demoTimer);
  }, []);

  // Computed stats from real data
  const filteredPatients = useMemo(() => {
    if (selectedDepartment === 'All Departments') return patients;
    return patients.filter((p) => p.aiTriage?.department === selectedDepartment);
  }, [patients, selectedDepartment]);

  const totalPatients = filteredPatients.length;
  const criticalCount = filteredPatients.filter((p) => p.aiTriage?.priorityLevel === 1).length;
  const avgWait = totalPatients > 0
    ? Math.round(filteredPatients.reduce((sum, p) => sum + getWaitMins(p.createdAt), 0) / totalPatients)
    : 0;
  const handleFreeBed = () => {
    setAvailableBeds((prev) => {
      const next = Math.min(BEDS_CAPACITY, prev + 1);
      localStorage.setItem('hs_available_beds', next);
      return next;
    });
  };

  // Unique departments from real data
  const departments = ['All Departments', ...new Set(patients.map((p) => p.aiTriage?.department).filter(Boolean))];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdmitPatient = async () => {
    if (!selectedPatient || availableBeds === 0) return;
    setActionLoading('admit');
    const admittedId = selectedPatient._id;
    try {
      await axiosInstance.patch(API_ROUTES.status(admittedId), { status: 'Admitted' });
      // Immediately remove from local queue and decrement bed count
      setPatients((prev) => prev.filter((p) => p._id !== admittedId));
      setAvailableBeds((prev) => {
        const next = Math.max(0, prev - 1);
        localStorage.setItem('hs_available_beds', next);
        return next;
      });
      showToast('Patient admitted to bed ✓');
      setIsDrawerOpen(false);
      setSelectedPatient(null);
    } catch (err) {
      console.error('Failed to admit patient:', err.message);
      showToast('Failed to admit patient', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDischargePatient = async () => {
    if (!selectedPatient) return;
    setActionLoading('discharge');
    const dischargedId = selectedPatient._id;
    try {
      await axiosInstance.patch(API_ROUTES.status(dischargedId), { status: 'Discharged' });
      // Immediately remove from local queue (discharged patients don't use a bed)
      setPatients((prev) => prev.filter((p) => p._id !== dischargedId));
      showToast('Patient treated & discharged ✓');
      setIsDrawerOpen(false);
      setSelectedPatient(null);
    } catch (err) {
      console.error('Failed to discharge patient:', err.message);
      showToast('Failed to discharge patient', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pStyle = selectedPatient ? (PRIORITY_STYLES[selectedPatient.aiTriage?.priorityLevel] || PRIORITY_STYLES[4]) : PRIORITY_STYLES[4];

  return (
    <div className="bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-50 min-h-screen flex flex-col font-body-sm">
      {escalationToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
          backgroundColor: '#78350f',
          border: '1px solid #f59e0b',
          borderRadius: '10px',
          padding: '16px 20px',
          minWidth: '320px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          <div style={{
            color: '#f59e0b',
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '1px',
            marginBottom: '6px'
          }}>
            ⚠️ PRIORITY ESCALATED
          </div>
          <div style={{ color: 'white', fontSize: '15px' }}>
            {escalationToast.patientName}
          </div>
          <div style={{
            color: '#fbbf24',
            fontSize: '13px',
            marginTop: '4px'
          }}>
            {escalationToast.oldLabel} → {escalationToast.newLabel}
            &nbsp;(waited {escalationToast.waitMinutes} mins)
          </div>
        </div>
      )}
      {showAlert && criticalAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#7f1d1d',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '20px 28px',
          minWidth: '420px',
          boxShadow: '0 0 30px rgba(239,68,68,0.5)',
          animation: 'pulse 1s infinite'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{
                color: '#ef4444',
                fontWeight: 'bold',
                fontSize: '14px',
                letterSpacing: '2px',
                marginBottom: '8px'
              }}>
                🚨 CRITICAL PATIENT ALERT
              </div>
              <div style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {criticalAlert.patientName}, {criticalAlert.age}
                {criticalAlert.gender === 'Male' ? 'M' : 'F'}
              </div>
              <div style={{
                color: '#fca5a5',
                fontSize: '14px',
                marginTop: '4px'
              }}>
                {criticalAlert.complaint}
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                Department: {criticalAlert.department}
                &nbsp;|&nbsp;
                Hospital: {criticalAlert.hospitalName}
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '12px',
                marginTop: '4px'
              }}>
                {criticalAlert.justification}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                Acknowledge & Prep
              </button>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TopNavBar */}
      <header className="bg-white dark:bg-slate-900 font-sans Inter text-sm antialiased docked full-width top-0 z-50 h-14 border-b border-slate-200 dark:border-slate-800 flat no shadows flex justify-between items-center w-full px-6">
        <div className="flex items-center gap-8 h-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-slate-50" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">HealthSync</span>
          </div>
          <nav className="hidden md:flex h-full gap-6">
            {role === 'Nurse' && (
              <a
                className="flex items-center text-slate-500 dark:text-slate-400 font-medium pb-[17px] mt-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 font-body-sm text-body-sm"
                onClick={(e) => { e.preventDefault(); navigate('/intake'); }}
                href="#"
              >
                Patient Intake
              </a>
            )}
            {role === 'Doctor' && (
              <a
                className="flex items-center text-slate-900 dark:text-slate-50 font-bold border-b-2 border-slate-900 dark:border-slate-50 pb-[17px] mt-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 font-body-sm text-body-sm"
                onClick={(e) => e.preventDefault()}
                href="#"
              >
                Live Dashboard
              </a>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-slate-900 dark:text-slate-50">
          <button className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70" onClick={() => setIsDarkMode(!isDarkMode)}>
            <span className="material-symbols-outlined" data-icon="dark_mode">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70">
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          </button>
          <button className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70">
            <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
          </button>
          <button 
            className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 text-red-500"
            onClick={handleLogout}
            title="Sign Out"
          >
            <span className="material-symbols-outlined" data-icon="logout">logout</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 flex justify-around py-3">
        {role === 'Nurse' && (
          <a className="flex flex-col items-center text-slate-500" onClick={(e) => { e.preventDefault(); navigate('/intake'); }} href="#">
            <span className="material-symbols-outlined">assignment</span>
            <span className="text-[10px] font-medium mt-1">Intake</span>
          </a>
        )}
        {role === 'Doctor' && (
          <a className="flex flex-col items-center text-primary" onClick={(e) => e.preventDefault()} href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-[10px] font-semibold mt-1">Dashboard</span>
          </a>
        )}
      </nav>

      <main className="flex-1 p-container-padding overflow-x-hidden pb-24 md:pb-container-padding mt-14 md:mt-0">
        <div className="max-w-7xl mx-auto space-y-grid-gutter">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-grid-gutter">
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Department Filter</span>
              <select
                className="bg-transparent text-on-surface dark:text-white font-headline-md text-xl outline-none cursor-pointer appearance-none w-full border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary transition-colors pb-1"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d} className="text-black dark:text-white bg-white dark:bg-slate-800 text-sm">{d}</option>
                ))}
              </select>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Total Patients</span>
              <span className="font-headline-md text-headline-md text-on-surface dark:text-white">{totalPatients}</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-status-critical-text dark:border-[#991b1b] rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-status-critical-text dark:text-red-500 uppercase">Critical</span>
              <span className="font-headline-md text-headline-md text-status-critical-text dark:text-red-500">{criticalCount}</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Beds Available</span>
                <button
                  onClick={handleFreeBed}
                  disabled={availableBeds >= BEDS_CAPACITY}
                  title="Simulate a patient leaving — frees one bed"
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors leading-none"
                >
                  <span className="material-symbols-outlined text-[13px]">add_circle</span>
                  Free Bed
                </button>
              </div>
              <span className={`font-headline-md text-headline-md ${
                availableBeds === 0
                  ? 'text-status-critical-text dark:text-red-500'
                  : availableBeds <= 3
                  ? 'text-status-urgent-text dark:text-orange-400'
                  : 'text-on-surface dark:text-white'
              }`}>{availableBeds}</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Avg Wait</span>
              <span className="font-headline-md text-headline-md text-on-surface dark:text-white">{avgWait} min</span>
            </div>
          </div>

          {/* Patient Queue Table */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container dark:bg-slate-900 border-b border-border-light dark:border-slate-700">
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Patient</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Status</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Priority</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Department</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Wait Time</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-data-tabular">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-on-surface-variant dark:text-slate-400">Loading patients...</td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-on-surface-variant dark:text-slate-400">
                        No patients in this department.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const style = PRIORITY_STYLES[patient.aiTriage?.priorityLevel] || PRIORITY_STYLES[4];
                      return (
                        <tr key={patient._id} className="border-b border-border-light dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="text-on-surface dark:text-white font-semibold">{patient.name} ({patient.age})</span>
                              <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">ID: {patient.patientId || 'N/A'}</span>
                              <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">{patient.complaint?.substring(0, 40)}{patient.complaint?.length > 40 ? '...' : ''}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white shadow-sm"
                              style={{ backgroundColor: patient.status === 'Waiting' ? '#f97316' : '#ef4444' }}
                            >
                              {patient.status || 'Waiting'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                              {patient.aiTriage?.priorityLabel || 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3 text-on-surface-variant dark:text-slate-300">{patient.aiTriage?.department || '—'}</td>
                          <td className={`p-3 font-medium ${patient.aiTriage?.priorityLevel === 1 ? 'text-status-critical-text dark:text-red-500' : 'text-on-surface-variant dark:text-slate-300'}`}>
                            {getWaitTime(patient.createdAt)}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              className="text-primary hover:text-secondary font-medium transition-colors p-1 rounded text-on-surface-variant dark:text-slate-400 hover:dark:text-white"
                              onClick={() => { setSelectedPatient(patient); setIsDrawerOpen(true); }}
                            >
                              <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 z-[100] transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-surface dark:bg-slate-900 border-l border-border-light dark:border-slate-700 shadow-xl z-[110] transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPatient && (
          <div className="h-full flex flex-col">
            <div className="p-4 flex justify-between items-start bg-surface dark:bg-slate-900 border-b border-border-light dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-on-surface dark:text-white">{selectedPatient.name}</h2>
                <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">ID: {selectedPatient.patientId || 'N/A'} · Age: {selectedPatient.age} · {selectedPatient.gender}</p>
              </div>
              <button
                className="p-1 rounded hover:bg-surface-dim text-on-surface-variant dark:text-slate-400 hover:dark:text-white transition-colors cursor-pointer"
                onClick={() => setIsDrawerOpen(false)}
              >
                <span className="material-symbols-outlined font-light text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              {/* AI Assessment */}
              <div>
                <div className={`${pStyle.bg} border ${pStyle.border} p-4 rounded ${pStyle.text}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    <span className="font-bold text-xs uppercase tracking-wider">AI Assessment · {selectedPatient.aiTriage?.priorityLabel}</span>
                  </div>
                  <p className="text-sm">{selectedPatient.aiTriage?.justification}</p>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <h3 className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-2">Chief Complaint</h3>
                <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 p-4 rounded text-sm text-on-surface dark:text-slate-200">
                  {selectedPatient.complaint}
                </div>
              </div>

              {/* Vitals */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Current Vitals</h3>
                  <span className="text-xs text-on-surface-variant dark:text-slate-400">On arrival</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-status-critical-text dark:text-red-500 text-[16px]">favorite</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">Heart Rate</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-2xl text-on-surface dark:text-white">{selectedPatient.vitals?.hr}</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">bpm</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-status-critical-text dark:text-red-500 text-[16px]">monitor_heart</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">Blood Pressure</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-2xl text-on-surface dark:text-white">{selectedPatient.vitals?.bp}</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">mmHg</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary dark:text-blue-400 text-[16px]">air</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">SpO2</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-2xl text-on-surface dark:text-white">{selectedPatient.vitals?.spo2}</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">%</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[16px]">device_thermostat</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">Temperature</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-2xl text-on-surface dark:text-white">{selectedPatient.vitals?.temp}</span>
                      <span className="text-on-surface-variant dark:text-slate-400 text-xs">°C</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border-light dark:border-slate-800 bg-surface dark:bg-slate-900">
              {/* Toast notification */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  toast ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div
                  className={`mx-4 mt-3 px-4 py-2 rounded flex items-center gap-2 text-sm font-semibold ${
                    toast?.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {toast?.type === 'error' ? 'error' : 'check_circle'}
                  </span>
                  {toast?.message}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {/* Primary: Admit to Bed */}
                <button
                  onClick={handleAdmitPatient}
                  disabled={actionLoading !== null || availableBeds === 0}
                  title={availableBeds === 0 ? 'No beds available' : 'Admit patient to a hospital bed'}
                  className="bg-primary dark:bg-blue-500 hover:bg-secondary dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary dark:text-white py-3 rounded-lg font-bold transition-colors cursor-pointer flex justify-center items-center gap-1.5 text-sm"
                >
                  {actionLoading === 'admit' ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">bed</span>
                  )}
                  {actionLoading === 'admit' ? 'Admitting…' : availableBeds === 0 ? 'No Beds Left' : 'Admit to Bed'}
                </button>

                {/* Secondary: Treat & Discharge */}
                <button
                  onClick={handleDischargePatient}
                  disabled={actionLoading !== null}
                  className="border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors cursor-pointer flex justify-center items-center gap-1.5 text-sm"
                >
                  {actionLoading === 'discharge' ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">outpatient_med</span>
                  )}
                  {actionLoading === 'discharge' ? 'Discharging…' : 'Treat & Discharge'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
