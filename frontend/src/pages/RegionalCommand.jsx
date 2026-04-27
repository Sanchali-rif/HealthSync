import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_ROUTES } from '../config/api';

const INITIAL_LOGS = [
  { time: '', text: '> SECURE TERMINAL ALPHA-9 [CONNECTED]', type: 'normal' }
];

export default function RegionalCommand({ isDarkMode, setIsDarkMode }) {
  const navigate = useNavigate();
  const role = localStorage.getItem('hs_role');
  const [hospitals, setHospitals] = useState([]);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [recommendedHospitalId, setRecommendedHospitalId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchLiveHospitals = async () => {
    try {
      const res = await fetch(API_ROUTES.dispatchLive);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch (err) {
      console.error("Failed to fetch live hospitals:", err);
    }
  };

  useEffect(() => {
    fetchLiveHospitals();

    const socket = io(SOCKET_URL);

    socket.on('hospitalUpdated', (updatedHospital) => {
      setHospitals(prev => prev.map(h => {
        if (h.name === updatedHospital.name) {
          return {
            ...h,
            availableBeds: updatedHospital.availableBeds,
            occupiedBeds: updatedHospital.occupiedBeds,
            capacity: updatedHospital.capacity,
            occupancyRate: Math.round((updatedHospital.occupiedBeds / updatedHospital.totalBeds) * 100),
            status: updatedHospital.capacity === 'Critical' ? 'CRITICAL' : updatedHospital.capacity === 'High' ? 'HIGH LOAD' : 'OPERATIONAL'
          };
        }
        return h;
      }));
    });

    socket.on('ambulanceDispatched', (data) => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [...prev, {
        time: `[${timeStr}]`,
        text: `CONFIRMED: Ambulance en route to ${data.hospitalName}`,
        type: 'success'
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  const handleGenerateEmergency = async () => {
    setIsLoading(true);
    setLogs(INITIAL_LOGS);
    setRecommendedHospitalId(null);
    
    const incidents = [
      "Multi-vehicle collision on highway",
      "Building fire with multiple casualties",
      "Mass poisoning at public event",
      "Train derailment with injuries",
      "Explosion at industrial facility"
    ];
    const randomIncident = incidents[Math.floor(Math.random() * incidents.length)];

    try {
      const res = await fetch(API_ROUTES.dispatchRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident: randomIncident,
          severity: "Critical"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, { time: `[${timeStr}]`, text: `ERROR: ${data.error}`, type: 'alert' }]);
        setIsLoading(false);
        return;
      }

      for (let i = 0; i < data.terminal_logs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setLogs(prev => [...prev, { time: '', text: data.terminal_logs[i], type: 'normal' }]);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setLogs(prev => [
        ...prev,
        { time: '', text: `→ ROUTING TO: ${data.recommendation.hospital_name}`, type: 'success' },
        { time: '', text: `→ REASON: ${data.recommendation.reason}`, type: 'success' },
        { time: '', text: `→ ETA: ${data.recommendation.estimated_eta}`, type: 'success' }
      ]);

      setRecommendedHospitalId(data.recommendation.hospital_name);

    } catch (err) {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [...prev, { time: `[${timeStr}]`, text: `ERROR: ${err.message}`, type: 'alert' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!recommendedHospitalId) return;

    try {
      const res = await fetch(API_ROUTES.dispatchConfirm, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalName: recommendedHospitalId })
      });

      const data = await res.json();
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

      if (!res.ok) {
        setLogs(prev => [...prev, { time: `[${timeStr}]`, text: `✗ DISPATCH FAILED: ${data.error}`, type: 'alert' }]);
        return;
      }

      setLogs(prev => [
        ...prev,
        { time: `[${timeStr}]`, text: `✓ AMBULANCE DISPATCHED TO: ${recommendedHospitalId}`, type: 'success' },
        { time: `[${timeStr}]`, text: `BED COUNT UPDATED. REMAINING: ${data.hospital.availableBeds}`, type: 'success' }
      ]);

      setHospitals(prev => prev.map(h => {
        if (h.name === recommendedHospitalId) {
          return {
            ...h,
            availableBeds: data.hospital.availableBeds,
            occupiedBeds: data.hospital.occupiedBeds,
            capacity: data.hospital.capacity,
            occupancyRate: data.hospital.occupancyRate,
            status: data.hospital.capacity === 'Critical' ? 'CRITICAL' : data.hospital.capacity === 'High' ? 'HIGH LOAD' : 'OPERATIONAL'
          };
        }
        return h;
      }));

      setRecommendedHospitalId(null);
    } catch (err) {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [...prev, { time: `[${timeStr}]`, text: `✗ DISPATCH FAILED: ${err.message}`, type: 'alert' }]);
    }
  };

  const handleReset = () => {
    setLogs(INITIAL_LOGS);
    setRecommendedHospitalId(null);
    fetchLiveHospitals();
  };

  const getHospitalStyles = (capacity) => {
    if (capacity === 'Critical') {
      return {
        badgeText: 'DIVERTING',
        badgeClass: 'bg-status-critical-bg text-status-critical-text border-red-300 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400',
        borderHover: 'hover:border-error dark:hover:border-red-500',
        valueColor: 'text-status-critical-text dark:text-red-400',
        progressBg: 'bg-error dark:bg-red-500',
        statusClass: 'text-status-critical-text dark:text-red-400'
      };
    } else if (capacity === 'High' || capacity === 'Moderate') {
      return {
        badgeText: 'ELEVATED',
        badgeClass: 'bg-status-urgent-bg text-status-urgent-text border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400',
        borderHover: 'hover:border-secondary dark:hover:border-orange-500',
        valueColor: 'text-primary dark:text-white',
        progressBg: 'bg-status-urgent-text dark:bg-orange-500',
        statusClass: 'text-status-urgent-text dark:text-orange-400'
      };
    } else {
      return {
        badgeText: 'NORMAL',
        badgeClass: 'bg-status-non-urgent-bg text-status-non-urgent-text border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400',
        borderHover: 'hover:border-status-non-urgent-text dark:hover:border-green-500',
        valueColor: 'text-status-non-urgent-text dark:text-green-400',
        progressBg: 'bg-status-non-urgent-text dark:bg-green-500',
        statusClass: 'text-status-non-urgent-text dark:text-green-400'
      };
    }
  };

  const totalOccupied = hospitals.reduce((sum, h) => sum + h.occupiedBeds, 0);
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalCapacity = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  return (
    <div className="bg-background dark:bg-slate-900 text-on-surface dark:text-slate-50 font-body-sm text-body-sm min-h-screen selection:bg-primary selection:text-white">
      {/* TopNavBar */}
      <header className="bg-white dark:bg-slate-900 font-sans Inter text-sm antialiased fixed top-0 left-0 w-full z-50 h-14 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-slate-50" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">HealthSync</span>
        </div>
        <nav className="flex space-x-6 h-full items-end">
          {role === 'Nurse' && (
            <a
              className="text-slate-500 dark:text-slate-400 font-medium pb-[17px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70"
              onClick={(e) => { e.preventDefault(); navigate('/intake'); }}
              href="#"
            >
              Patient Intake
            </a>
          )}
          {role === 'Doctor' && (
            <a
              className="text-slate-500 dark:text-slate-400 font-medium pb-[17px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70"
              onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
              href="#"
            >
              Live Dashboard
            </a>
          )}
          <a
            className="text-slate-900 dark:text-slate-50 font-bold border-b-2 border-slate-900 dark:border-slate-50 pb-[17px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70"
            onClick={(e) => e.preventDefault()}
            href="#"
          >
            Regional Command
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-status-non-urgent-bg dark:bg-green-900/30 rounded-DEFAULT border border-status-non-urgent-text dark:border-green-800 border-opacity-20">
            <div className="w-2 h-2 rounded-full bg-status-non-urgent-text dark:bg-green-500 animate-pulse"></div>
            <span className="font-label-caps text-status-non-urgent-text dark:text-green-500 text-[10px] font-bold uppercase">LIVE</span>
          </div>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT" onClick={() => setIsDarkMode(!isDarkMode)}>
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT relative">
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

      {/* SideNavBar (Hidden for now) */}
      {/* 
      <aside className="hidden md:flex fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 flex-col p-3 space-y-1 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
        <div className="px-3 py-4 mb-2">
          <p className="text-sm font-black text-slate-900 dark:text-slate-50 font-logo uppercase">Dispatch HQ</p>
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Sector Alpha-9</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700 rounded-md transition-transform duration-200 cursor-pointer" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <span className="material-symbols-outlined text-[20px]" data-icon="dashboard">dashboard</span>
            <span className="font-medium text-xs">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-transform duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]" data-icon="local_hospital">local_hospital</span>
            <span className="font-medium text-xs">Hospital Grid</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-transform duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]" data-icon="radiology">radiology</span>
            <span className="font-medium text-xs">Unit Dispatch</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-transform duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]" data-icon="map">map</span>
            <span className="font-medium text-xs">Incident Maps</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-transform duration-200" href="#">
            <span className="material-symbols-outlined text-[20px]" data-icon="monitoring">monitoring</span>
            <span className="font-medium text-xs">Analytics</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 text-xs hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-transform duration-200" href="#">
            <span className="material-symbols-outlined text-[18px]" data-icon="help">help</span>
            Support
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 text-xs hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-transform duration-200" href="#">
            <span className="material-symbols-outlined text-[18px]" data-icon="dns">dns</span>
            System Status
          </a>
        </div>
      </aside>
      */}

      {/* Main Content Canvas */}
      <main className="pt-14 min-h-screen">
        <div className="p-6 max-w-[1400px] mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
            <div>
              <p className="text-on-primary-container dark:text-slate-400 font-label-caps text-label-caps uppercase tracking-wider mb-1">System Overview</p>
              <h2 className="text-primary dark:text-white font-headline-md text-headline-md text-2xl font-bold">Regional Grid Control</h2>
            </div>
            <button 
              onClick={handleReset}
              className="text-xs font-semibold text-on-primary-container dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]" data-icon="refresh">refresh</span>
              Reset Demo
            </button>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            
            {/* Left Column (60%) */}
            <section className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-headline-md text-headline-md text-lg dark:text-white">Live Regional Grid</h3>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-surface-container-high dark:bg-slate-800 rounded text-[10px] font-bold text-on-surface-variant dark:text-slate-300 uppercase border border-outline-variant dark:border-slate-700">
                    Total Capacity: {totalCapacity}%
                  </span>
                </div>
              </div>

              {hospitals.map(hospital => {
                const styles = getHospitalStyles(hospital.capacity);
                const statusText = hospital.status === 'CRITICAL' ? 'CRITICAL LOAD' : hospital.status === 'HIGH LOAD' ? 'MODERATE LOAD' : 'LOW LOAD';

                return (
                  <div 
                    key={hospital.id} 
                    className={`bg-surface-container-lowest dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm ${styles.borderHover} transition-colors`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-primary dark:text-white">{hospital.name}</h4>
                      </div>
                      <span className={`${styles.badgeClass} px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase`}>
                        {styles.badgeText}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase">Bed Count</p>
                        <p className={`text-2xl font-black ${styles.valueColor} transition-all duration-300`}>{hospital.availableBeds}</p>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase">Wait Time</p>
                        <p className="text-2xl font-black dark:text-white">{hospital.wait_time_mins}m</p>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400 uppercase">Status</p>
                        <p className={`text-xs font-bold uppercase mt-2 ${styles.statusClass}`}>{statusText}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant dark:text-slate-400">
                        <span>Utilization</span>
                        <span>{hospital.occupancyRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${styles.progressBg}`} style={{ width: `${hospital.occupancyRate}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Right Column (40%) */}
            <section className="lg:col-span-4 space-y-6">
              <div className="bg-[#0F172A] rounded-xl p-6 shadow-xl border border-slate-700 text-white flex flex-col min-h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400" data-icon="psychology">psychology</span>
                    <h3 className="font-bold text-lg tracking-tight">Smart Dispatch</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Engine Online</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <button 
                    onClick={handleGenerateEmergency}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="material-symbols-outlined animate-spin" data-icon="sync">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]" data-icon="bolt">bolt</span>
                    )}
                    {isLoading ? 'Processing...' : 'Generate Mock Emergency'}
                  </button>
                </div>

                {/* AI Routing Terminal */}
                <div className="flex-1 bg-black/50 border border-slate-700 rounded-lg p-4 font-mono text-[11px] overflow-hidden relative flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/30"></div>
                  
                  <div ref={terminalRef} className="space-y-1 flex-1 overflow-y-auto pb-20">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        {log.time && <span className="text-slate-500">{log.time}</span>}
                        <span className={log.type === 'alert' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-300'}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <span className="text-blue-400 animate-pulse">_</span>
                    </div>
                  </div>

                  {recommendedHospitalId && (
                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-500/20 rounded text-blue-400">
                          <span className="material-symbols-outlined text-[20px]" data-icon="route">route</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">AI Recommendation</p>
                          <p className="text-xs font-medium text-slate-100">Redirect incoming Code 3 to {recommendedHospitalId}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <button 
                    onClick={handleDispatch}
                    disabled={!recommendedHospitalId}
                    className="w-full py-4 px-4 bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-slate-900 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.97]"
                  >
                    <span className="material-symbols-outlined" data-icon="ambulance" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>ambulance</span>
                    Dispatch Ambulance
                  </button>
                  <p className="text-center text-[10px] text-slate-500 font-medium mt-4">
                    Confirmation logs will be transmitted to Sector Alpha-9 Command.
                  </p>
                </div>
              </div>

              {/* Sub-module Map (Placeholder) */}
              <div className="bg-surface-container-lowest dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-48 overflow-hidden relative">
                <img 
                  alt="Regional Map" 
                  className="absolute inset-0 w-full h-full object-cover grayscale brightness-110 dark:brightness-75 opacity-40 dark:opacity-20" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2fRLkfAVYx9gd8jgZlU1UGck9fcqTYOtDV42ziQfjyx5o3mIOvWqbxSTdpm4K-2kpJl5eOEjFogG9HMXutnYn0UI4b6X_r3xYbAcBUhmNXzk29ukkoa7FfsIAWwKN3GVo0CnxIffUsy2xMbQCg9qbqhh7zK1stqGYGEEO600kRRQNJ4-Goo3hUnYklvV4iuTdjUaZOiEZDa-ZldsNMdjzkgBQ_v8yUcfN87oLMm2giT1cocQdgbAMCiiWekKxqwh9jCwglhKLv3Ze"
                />
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black uppercase text-on-surface dark:text-slate-300">Unit Locations</h4>
                    <span className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded font-bold dark:text-white">12 Active Units</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold dark:text-white">R-102: Enroute</div>
                    <div className="px-2 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold dark:text-white">M-04: On-Scene</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
