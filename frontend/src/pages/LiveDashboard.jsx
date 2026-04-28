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
    return BEDS_CAPACITY;
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [escalationToast, setEscalationToast] = useState(null);

  // New States
  const [analytics, setAnalytics] = useState(null);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [escalations, setEscalations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedTransferHospital, setSelectedTransferHospital] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleLogout = async () => {
    try {
      localStorage.removeItem('hs_token');
      localStorage.removeItem('hs_refresh');
      localStorage.removeItem('hs_role');
      localStorage.removeItem('selectedHospitalId');
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const role = localStorage.getItem('hs_role');

  const fetchAnalytics = async () => {
    try {
      const res = await axiosInstance.get('/api/analytics/dashboard');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err.message);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (isDrawerOpen) {
      const fetchHospitals = async () => {
        try {
          const res = await axiosInstance.get('/api/hospitals');
          setHospitals(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchHospitals();
    }
  }, [isDrawerOpen]);

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

    socketRef.current.on('patientUpdated', (updatedPatient) => {
      setPatients((prev) => 
        prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
      );
    });

    socketRef.current.on('criticalPatientAlert', (data) => {
      setCriticalAlert(data);
      setShowCriticalModal(true);
      setCountdown(10);
    });

    socketRef.current.on('patientEscalated', (data) => {
      const alertId = Date.now();
      setEscalations(prev => [
        ...prev, 
        { ...data, alertId }
      ]);
      
      setTimeout(() => {
        setEscalations(prev => prev.filter(a => a.alertId !== alertId));
      }, 5000);

      setPatients(prev =>
        prev.map(p =>
          p._id === data.patientId
            ? {
                ...p,
                aiTriage: {
                  ...p.aiTriage,
                  priorityLevel: data.newLevel,
                  priorityLabel: data.newLabel
                }
              }
            : p
        ).sort((a, b) => a.aiTriage.priorityLevel - b.aiTriage.priorityLevel)
      );
    });

    socketRef.current.on('hospitalUpdated', (data) => {
      fetchAnalytics();
    });

    return () => {
      socketRef.current?.off('newPatient');
      socketRef.current?.off('patientRemoved');
      socketRef.current?.off('patientUpdated');
      socketRef.current?.off('criticalPatientAlert');
      socketRef.current?.off('patientEscalated');
      socketRef.current?.off('patientAdmitted');
      socketRef.current?.off('patientTransferred');
      socketRef.current?.off('hospitalUpdated');
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!showCriticalModal) return;
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowCriticalModal(false);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showCriticalModal]);

  const userHospitalId = localStorage.getItem('selectedHospitalId');
  const userHospital = useMemo(() => {
    if (!analytics || !userHospitalId) return null;
    return analytics.hospitals.find(h => h.id === userHospitalId);
  }, [analytics, userHospitalId]);

  const displayAvailableBeds = userHospital ? userHospital.availableBeds : (analytics ? analytics.network.totalAvailable : availableBeds);

  const filteredPatients = useMemo(() => {
    // Show Waiting + Admitted patients (still in the hospital)
    // Discharged patients are removed via patientRemoved socket event
    const inHospital = patients.filter((p) => p.status === 'Waiting' || p.status === 'Admitted');
    if (selectedDepartment === 'All Departments') return inHospital;
    return inHospital.filter((p) => p.aiTriage?.department === selectedDepartment);
  }, [patients, selectedDepartment]);

  const totalPatients = filteredPatients.length;
  // Critical only counts patients still waiting (not yet admitted)
  const criticalCount = filteredPatients.filter((p) => p.aiTriage?.priorityLevel === 1 && p.status === 'Waiting').length;
  const avgWait = totalPatients > 0
    ? Math.round(filteredPatients.reduce((sum, p) => sum + getWaitMins(p.createdAt), 0) / totalPatients)
    : 0;

  const handleFreeBed = () => {
    // Left empty. Real implementation updates via WebSocket and API fetch.
  };

  const departments = ['All Departments', ...new Set(patients.map((p) => p.aiTriage?.department).filter(Boolean))];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleOpenPatientById = async (id) => {
    setIsDrawerOpen(true);
    try {
      const res = await axiosInstance.get(`/api/patients/${id}`);
      setSelectedPatient(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPatient = async (patient) => {
    setIsDrawerOpen(true);
    setSelectedPatient(patient);
    try {
      const res = await axiosInstance.get(`/api/patients/${patient._id}`);
      setSelectedPatient(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdmitPatient = async () => {
    if (!selectedPatient) return;
    setActionLoading('admit');
    const admittedId = selectedPatient._id;
    try {
      const { data: updatedPatient } = await axiosInstance.patch(API_ROUTES.status(admittedId), { status: 'Admitted' });
      // Update both the list and the open drawer with the fresh server response
      setPatients((prev) => prev.map((p) => (p._id === admittedId ? updatedPatient : p)));
      setSelectedPatient(updatedPatient);
      showToast('Patient admitted to bed ✓');
      // Close drawer after short delay so user sees the updated status
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSelectedPatient(null);
      }, 800);
    } catch (err) {
      const backendMsg = err.response?.data?.error || err.message;
      console.error('Failed to admit patient:', err.response?.status, backendMsg);
      showToast(`Admit failed: ${backendMsg}`, 'error');
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
      // Remove from local queue immediately — this updates Total Patients & Critical counts instantly
      setPatients((prev) => prev.filter((p) => p._id !== dischargedId));
      showToast('Patient treated & discharged ✓');
      // Refresh analytics to sync beds available
      fetchAnalytics();
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSelectedPatient(null);
      }, 800);
    } catch (err) {
      const backendMsg = err.response?.data?.error || err.message;
      console.error('Failed to discharge patient:', err.response?.status, backendMsg);
      showToast(`Discharge failed: ${backendMsg}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await axiosInstance.post(`/api/patients/${selectedPatient._id}/notes`, { note: noteText });
      setSelectedPatient(res.data);
      setNoteText('');
      showToast('Note added ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to add note', 'error');
    }
  };

  const handleTransferPatient = async () => {
    if (!selectedTransferHospital) return;
    try {
      await axiosInstance.post('/api/hospitals/bed-request', {
        patientId: selectedPatient._id,
        fromHospitalName: selectedPatient.hospitalName,
        toHospitalName: selectedTransferHospital,
        reason: "Doctor initiated transfer"
      });
      showToast('Transfer successful', 'success');
      setPatients(prev => prev.filter(p => p._id !== selectedPatient._id));
      setTimeout(() => setIsDrawerOpen(false), 2000);
    } catch (err) {
      console.error(err);
      showToast('Failed to transfer patient', 'error');
    }
  };

  const pStyle = selectedPatient ? (PRIORITY_STYLES[selectedPatient.aiTriage?.priorityLevel] || PRIORITY_STYLES[4]) : PRIORITY_STYLES[4];

  return (
    <div className="bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-50 min-h-screen flex flex-col font-body-sm relative">
      
      {showCriticalModal && criticalAlert && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1a0000',
            border: '2px solid #ff0000',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h1 style={{ color: '#ff0000', fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px 0', textAlign: 'center' }}>
              🚨 CRITICAL PATIENT ALERT
            </h1>
            
            <div style={{ color: 'white', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {criticalAlert.patientName}, {criticalAlert.age}{criticalAlert.gender?.charAt(0).toUpperCase()} - {criticalAlert.department}
                </div>
                <div style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '8px' }}>
                  {criticalAlert.complaint} - {criticalAlert.justification}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                  Admitted to: {criticalAlert.hospitalName}
                <div style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>{criticalAlert.vitals?.spo2} <span style={{fontSize:'12px', fontWeight:'normal'}}>%</span></div>
              </div>
              <div style={{ backgroundColor: '#450a0a', padding: '12px', borderRadius: '8px', border: '1px solid #7f1d1d' }}>
                <div style={{ fontSize: '12px', color: '#fca5a5', marginBottom: '4px' }}>Temperature</div>
                <div style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>{criticalAlert.vitals?.temp} <span style={{fontSize:'12px', fontWeight:'normal'}}>°C</span></div>
              </div>
            </div>
            
            <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
              Auto closing in {countdown}s
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                style={{ flex: 1, backgroundColor: '#ff0000', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  setShowCriticalModal(false);
                  handleOpenPatientById(criticalAlert.patientId);
                }}
              >
                View Patient
              </button>
              <button 
                style={{ flex: 1, backgroundColor: 'transparent', color: '#94a3b8', padding: '12px', border: '1px solid #94a3b8', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setShowCriticalModal(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TopNavBar */}
      <header className="bg-white dark:bg-slate-900 font-sans Inter text-sm antialiased docked full-width top-0 z-50 h-14 border-b border-slate-200 dark:border-slate-800 flat no shadows flex justify-between items-center w-full px-6">
        <div className="flex items-center gap-8 h-full">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <img src="/nav.JPG" alt="HealthSync" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block' }} />
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
                displayAvailableBeds <= 0
                    ? 'text-status-critical-text dark:text-red-500 text-sm italic'
                    : displayAvailableBeds <= 3
                    ? 'text-status-urgent-text dark:text-orange-400'
                    : 'text-on-surface dark:text-white'
                }`}>{displayAvailableBeds <= 0 ? `0 - Sorry, no bed available` : displayAvailableBeds}</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Avg Wait</span>
              <span className="font-headline-md text-headline-md text-on-surface dark:text-white">{analytics ? analytics.waitTime.average + " min" : avgWait + " min"}</span>
            </div>
          </div>

          {escalations.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {escalations.map((esc) => (
                <div key={esc.alertId} className="w-full bg-orange-500 text-white p-3 rounded flex justify-between items-center shadow-md">
                  <span>⚠️ <b>{esc.patientName}</b> escalated to <b>{esc.newLabel}</b> after {esc.waitMinutes} minutes</span>
                  <button className="text-white hover:text-orange-200" onClick={() => setEscalations(prev => prev.filter(a => a.alertId !== esc.alertId))}>
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

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
                              onClick={() => handleOpenPatient(patient)}
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

              {/* --- SECTION 1: PATIENT JOURNEY --- */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">PATIENT JOURNEY</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
                  {(!selectedPatient.timeline || selectedPatient.timeline.length === 0) ? (
                    <div className="text-sm text-gray-400">No journey recorded yet</div>
                  ) : (
                    selectedPatient.timeline.map((entry, idx) => {
                      const colorMap = {
                        Registered: 'bg-blue-500',
                        Admitted: 'bg-green-500',
                        Escalated: 'bg-orange-500',
                        Transferred: 'bg-purple-500',
                        Treated: 'bg-teal-500'
                      };
                      const dotColor = colorMap[entry.status] || 'bg-gray-500';
                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-4 border-surface dark:border-slate-900 ${dotColor} z-10`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{entry.status}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(entry.timestamp).toLocaleString('en-US', { hour: '2-digit', minute:'2-digit', month:'short', day:'numeric' })}
                              </span>
                            </div>
                            {entry.note && <div className="text-xs text-gray-400 mt-1">{entry.note}</div>}
                            {entry.updatedBy && <div className="text-xs text-gray-500 italic mt-0.5">by {entry.updatedBy}</div>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* --- SECTION 2: DOCTOR NOTES --- */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">DOCTOR NOTES</h3>
                <div className="space-y-3 mb-3">
                  {(!selectedPatient.notes || selectedPatient.notes.length === 0) ? (
                    <div className="text-sm text-gray-400">No notes yet</div>
                  ) : (
                    selectedPatient.notes.map((note, idx) => (
                      <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700">
                        <div className="text-sm text-white">{note.text}</div>
                        <div className="text-xs text-gray-400 mt-2 flex justify-between">
                          <span>— {note.addedBy}</span>
                          <span>{new Date(note.timestamp).toLocaleString('en-US', { hour: '2-digit', minute:'2-digit', month:'short', day:'numeric' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a clinical note..."
                    rows={3}
                    className="w-full bg-slate-800 text-white rounded p-3 text-sm border border-slate-700 focus:border-blue-500 outline-none resize-none"
                  />
                  <button 
                    onClick={handleAddNote}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold py-2 px-4 rounded self-end transition-colors"
                  >
                    Add Note
                  </button>
                  {toast?.type === 'error' && noteText && <div className="text-xs text-red-500 text-right">{toast.message}</div>}
                </div>
              </div>

              {/* --- SECTION 3: TRANSFER PATIENT --- */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRANSFER PATIENT</h3>
                <div className="bg-slate-800 p-4 rounded flex flex-col gap-3 border border-slate-700">
                  <select
                    value={selectedTransferHospital}
                    onChange={(e) => setSelectedTransferHospital(e.target.value)}
                    className="w-full bg-slate-900 text-white rounded p-2 text-sm border border-slate-700 outline-none"
                  >
                    <option value="">Select hospital destination...</option>
                    {hospitals.filter(h => h.name !== selectedPatient.hospitalName).map(h => (
                      <option key={h._id} value={h.name}>{h.name} ({h.availableBeds} beds available)</option>
                    ))}
                  </select>
                  <button
                    onClick={handleTransferPatient}
                    disabled={!selectedTransferHospital}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded transition-colors"
                  >
                    Transfer
                  </button>
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
              <div className="p-4 flex flex-col gap-3">
                {selectedPatient.status !== 'Admitted' ? (
                  <button
                    onClick={handleAdmitPatient}
                    disabled={actionLoading !== null || displayAvailableBeds <= 0}
                    title={displayAvailableBeds <= 0 ? 'No beds available' : 'Admit patient to a hospital bed'}
                    className="w-full bg-primary dark:bg-blue-500 hover:bg-secondary dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary dark:text-white py-3 rounded-lg font-bold transition-colors cursor-pointer flex justify-center items-center gap-1.5 text-sm"
                  >
                    {actionLoading === 'admit' ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">bed</span>
                    )}
                    {actionLoading === 'admit' ? 'Admitting…' : displayAvailableBeds <= 0 ? 'No Beds Left' : 'Admit to Bed'}
                  </button>
                ) : (
                  <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 py-3 rounded-lg font-bold flex justify-center items-center gap-1.5 text-sm border border-emerald-200 dark:border-emerald-800">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Patient Admitted to Bed
                  </div>
                )}

                <button
                  onClick={handleDischargePatient}
                  disabled={actionLoading !== null}
                  className="w-full border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors cursor-pointer flex justify-center items-center gap-1.5 text-sm"
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
