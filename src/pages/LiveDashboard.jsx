import React from 'react';

export default function LiveDashboard({ setCurrentPage }) {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-sm">
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
          <button className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70">
            <span className="material-symbols-outlined" data-icon="dark_mode">dark_mode</span>
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
            <div className="bg-surface-container-lowest border border-border-light rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Patients</span>
              <span className="font-headline-md text-headline-md text-on-surface">5</span>
            </div>
            <div className="bg-surface-container-lowest border border-status-critical-text rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-status-critical-text uppercase">Critical</span>
              <span className="font-headline-md text-headline-md text-status-critical-text">2</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-light rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Beds Available</span>
              <span className="font-headline-md text-headline-md text-on-surface">8</span>
            </div>
            <div className="bg-surface-container-lowest border border-border-light rounded p-3 flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Avg Wait</span>
              <span className="font-headline-md text-headline-md text-on-surface">22 min</span>
            </div>
          </div>

          {/* Patient Queue Table */}
          <div className="bg-surface-container-lowest border border-border-light rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-border-light">
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant uppercase">Patient</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant uppercase">Priority</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant uppercase">Department</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant uppercase">Wait Time</th>
                    <th className="p-3 font-label-caps text-label-caps text-on-surface-variant uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-data-tabular">
                  <tr className="border-b border-border-light hover:bg-surface-container-low transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">Rahul Sharma (34)</span>
                        <span className="text-on-surface-variant text-xs mt-0.5">Chest pain</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-critical-bg text-status-critical-text border border-status-critical-text/20">Critical</span>
                    </td>
                    <td className="p-3 text-on-surface-variant">Resuscitation</td>
                    <td className="p-3 text-on-surface-variant font-medium text-status-critical-text">2 min</td>
                    <td className="p-3 text-right">
                      <button className="text-primary hover:text-secondary font-medium transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-border-light hover:bg-surface-container-low transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">Priya Das (61)</span>
                        <span className="text-on-surface-variant text-xs mt-0.5">Unconscious</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-critical-bg text-status-critical-text border border-status-critical-text/20">Critical</span>
                    </td>
                    <td className="p-3 text-on-surface-variant">Resuscitation</td>
                    <td className="p-3 text-on-surface-variant font-medium text-status-critical-text">5 min</td>
                    <td className="p-3 text-right">
                      <button className="text-primary hover:text-secondary font-medium transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-border-light hover:bg-surface-container-low transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">Amir Khan (45)</span>
                        <span className="text-on-surface-variant text-xs mt-0.5">High fever</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-urgent-bg text-status-urgent-text border border-status-urgent-text/20">Urgent</span>
                    </td>
                    <td className="p-3 text-on-surface-variant">Emergency</td>
                    <td className="p-3 text-on-surface-variant font-medium">12 min</td>
                    <td className="p-3 text-right">
                      <button className="text-primary hover:text-secondary font-medium transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-border-light hover:bg-surface-container-low transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">Sunita Roy (29)</span>
                        <span className="text-on-surface-variant text-xs mt-0.5">Suspected fracture</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-priority-bg text-status-priority-text border border-status-priority-text/20">Priority</span>
                    </td>
                    <td className="p-3 text-on-surface-variant">Orthopaedics</td>
                    <td className="p-3 text-on-surface-variant font-medium">28 min</td>
                    <td className="p-3 text-right">
                      <button className="text-primary hover:text-secondary font-medium transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">Dev Mehta (22)</span>
                        <span className="text-on-surface-variant text-xs mt-0.5">Mild cold</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-non-urgent-bg text-status-non-urgent-text border border-status-non-urgent-text/20">Non-urgent</span>
                    </td>
                    <td className="p-3 text-on-surface-variant">General OPD</td>
                    <td className="p-3 text-on-surface-variant font-medium">45 min</td>
                    <td className="p-3 text-right">
                      <button className="text-primary hover:text-secondary font-medium transition-colors p-1">
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
    </div>
  );
}
