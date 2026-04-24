import React, { useState } from 'react';

export default function LiveDashboard({ setCurrentPage, isDarkMode, setIsDarkMode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-50 min-h-screen flex flex-col font-body-sm">
      {/* TopNavBar */}
      <header className="bg-white dark:bg-slate-900 font-sans Inter text-sm antialiased docked full-width top-0 z-50 h-14 border-b border-slate-200 dark:border-slate-800 flat no shadows flex justify-between items-center w-full px-6">
        <div className="flex items-center gap-8 h-full">
          <div className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase font-logo text-logo">
            HealthSync
          </div>
          <nav className="hidden md:flex h-full gap-6">
            <a 
              className="flex items-center text-slate-500 dark:text-slate-400 font-medium pb-[17px] mt-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 font-body-sm text-body-sm"
              onClick={(e) => {
                e.preventDefault();
                if (setCurrentPage) setCurrentPage('patient-intake');
              }}
              href="#"
            >
              Patient Intake
            </a>
            <a 
              className="flex items-center text-slate-900 dark:text-slate-50 font-bold border-b-2 border-slate-900 dark:border-slate-50 pb-[17px] mt-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 font-body-sm text-body-sm"
              onClick={(e) => e.preventDefault()}
              href="#"
            >
              Live Dashboard
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-slate-900 dark:text-slate-50">
          <button 
            className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <span className="material-symbols-outlined" data-icon="dark_mode">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70">
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          </button>
          <button className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70">
            <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 flex justify-around py-3">
        <a 
          className="flex flex-col items-center text-slate-500" 
          onClick={(e) => {
            e.preventDefault();
            if (setCurrentPage) setCurrentPage('patient-intake');
          }}
          href="#"
        >
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[10px] font-medium mt-1">Intake</span>
        </a>
        <a 
          className="flex flex-col items-center text-primary" 
          onClick={(e) => e.preventDefault()}
          href="#"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="text-[10px] font-semibold mt-1">Dashboard</span>
        </a>
      </nav>

      <main className="flex-1 p-container-padding overflow-x-hidden pb-24 md:pb-container-padding mt-14 md:mt-0">
        <div className="max-w-7xl mx-auto space-y-grid-gutter">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-grid-gutter">
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Total Patients</span>
              <span className="font-headline-md text-headline-md text-on-surface dark:text-white">5</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-status-critical-text dark:border-[#991b1b] rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-status-critical-text dark:text-red-500 uppercase">Critical</span>
              <span className="font-headline-md text-headline-md text-status-critical-text dark:text-red-500">2</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Beds Available</span>
              <span className="font-headline-md text-headline-md text-on-surface dark:text-white">8</span>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Avg Wait</span>
              <span className="font-headline-md text-headline-md text-on-surface dark:text-white">22 min</span>
            </div>
          </div>

          {/* Patient Queue Table */}
          <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container dark:bg-slate-900 border-b border-border-light dark:border-slate-700">
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Patient</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Priority</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Department</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase">Wait Time</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant dark:text-slate-400 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-data-tabular">
                  <tr className="border-b border-border-light dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface dark:text-white font-semibold">Rahul Sharma (34)</span>
                        <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">Chest pain</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-critical-bg dark:bg-[#450a0a] text-status-critical-text dark:text-red-500 border border-status-critical-text/20 dark:border-[#991b1b]">Critical</span>
                    </td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300">Resuscitation</td>
                    <td className="p-3 text-on-surface-variant dark:text-red-500 font-medium text-status-critical-text">2 min</td>
                    <td className="p-3 text-right">
                      <button 
                        className="text-primary hover:text-secondary font-medium transition-colors p-1 rounded text-on-surface-variant dark:text-slate-400 hover:dark:text-white" 
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-border-light dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface dark:text-white font-semibold">Priya Das (61)</span>
                        <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">Unconscious</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-critical-bg dark:bg-[#450a0a] text-status-critical-text dark:text-red-500 border border-status-critical-text/20 dark:border-[#991b1b]">Critical</span>
                    </td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300">Resuscitation</td>
                    <td className="p-3 text-on-surface-variant dark:text-red-500 font-medium text-status-critical-text">5 min</td>
                    <td className="p-3 text-right">
                      <button 
                        className="text-primary hover:text-secondary font-medium transition-colors p-1 rounded text-on-surface-variant dark:text-slate-400 hover:dark:text-white" 
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-border-light dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface dark:text-white font-semibold">Amir Khan (45)</span>
                        <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">High fever</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-urgent-bg dark:bg-[#431407] text-status-urgent-text dark:text-orange-500 border border-status-urgent-text/20 dark:border-orange-900">Urgent</span>
                    </td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300">Emergency</td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300 font-medium">12 min</td>
                    <td className="p-3 text-right">
                      <button 
                        className="text-primary hover:text-secondary font-medium transition-colors p-1 rounded text-on-surface-variant dark:text-slate-400 hover:dark:text-white" 
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-border-light dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface dark:text-white font-semibold">Sunita Roy (29)</span>
                        <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">Suspected fracture</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-priority-bg dark:bg-blue-900/30 text-status-priority-text dark:text-blue-500 border border-status-priority-text/20 dark:border-blue-900">Priority</span>
                    </td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300">Orthopaedics</td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300 font-medium">28 min</td>
                    <td className="p-3 text-right">
                      <button 
                        className="text-primary hover:text-secondary font-medium transition-colors p-1 rounded text-on-surface-variant dark:text-slate-400 hover:dark:text-white" 
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface dark:text-white font-semibold">Dev Mehta (22)</span>
                        <span className="text-on-surface-variant dark:text-slate-400 text-xs mt-0.5">Mild cold</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-non-urgent-bg dark:bg-green-900/30 text-status-non-urgent-text dark:text-green-500 border border-status-non-urgent-text/20 dark:border-green-900">Non-urgent</span>
                    </td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300">General OPD</td>
                    <td className="p-3 text-on-surface-variant dark:text-slate-300 font-medium">45 min</td>
                    <td className="p-3 text-right">
                      <button 
                        className="text-primary hover:text-secondary font-medium transition-colors p-1 rounded text-on-surface-variant dark:text-slate-400 hover:dark:text-white" 
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
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
        <div className="h-full flex flex-col">
          <div className="p-4 flex justify-between items-start bg-surface dark:bg-slate-900 border-b border-border-light dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-on-surface dark:text-white">Rahul Sharma</h2>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">Age: 34</p>
            </div>
            <button 
              className="p-1 rounded hover:bg-surface-dim text-on-surface-variant dark:text-slate-400 hover:dark:text-white transition-colors cursor-pointer"
              onClick={() => setIsDrawerOpen(false)}
            >
              <span className="material-symbols-outlined font-light text-[20px]">close</span>
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            <div>
              <div className="bg-status-critical-bg dark:bg-[#450a0a] border border-status-critical-text/20 dark:border-[#991b1b] p-4 rounded text-status-critical-text dark:text-red-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                  <span className="font-bold text-xs uppercase tracking-wider">AI Assessment</span>
                </div>
                <p className="text-sm">
                  Potential Acute Myocardial Infarction. Immediate intervention required.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-2">Chief Complaint</h3>
              <div className="bg-surface-container-lowest dark:bg-slate-800 border border-border-light dark:border-slate-700 p-4 rounded text-sm text-on-surface dark:text-slate-200">
                Crushing chest pain radiating to the left arm for 45 minutes.
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Current Vitals</h3>
                <span className="text-xs text-on-surface-variant dark:text-slate-400">Updated 2m ago</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-status-critical-text dark:text-red-500 text-[16px]">favorite</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-xs">Heart Rate</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-on-surface dark:text-red-500">118</span>
                    <span className="text-on-surface-variant dark:text-red-500 text-xs">bpm</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-status-critical-text dark:text-red-500 text-[16px]">monitor_heart</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-xs">Blood Pressure</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-on-surface dark:text-red-500">145/90</span>
                    <span className="text-on-surface-variant dark:text-red-500 text-xs">mmHg</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary dark:text-blue-400 text-[16px]">air</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-xs">SpO2</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-on-surface dark:text-white">97</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-xs">%</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest dark:bg-slate-800 p-3 rounded border border-border-light dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[16px]">device_thermostat</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-xs">Temperature</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-on-surface dark:text-white">37.1</span>
                    <span className="text-on-surface-variant dark:text-slate-400 text-xs">°C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border-light dark:border-slate-800 bg-surface dark:bg-slate-900">
            <button className="w-full bg-primary dark:bg-blue-500 hover:bg-secondary dark:hover:bg-blue-600 text-on-primary dark:text-black py-3 rounded font-bold transition-colors cursor-pointer flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Acknowledge & Admit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
