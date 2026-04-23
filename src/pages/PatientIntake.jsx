import React from 'react';

export default function PatientIntake() {
  return (
    <div className="bg-background text-on-background font-body-sm min-h-screen">
      {/* TopNavBar */}
      <header className="bg-white dark:bg-slate-900 font-sans Inter text-sm antialiased docked full-width top-0 z-50 h-14 border-b border-slate-200 dark:border-slate-800 flat no shadows flex justify-between items-center w-full px-6 hidden md:flex">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-slate-50" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">HealthSync</span>
        </div>
        <nav className="flex space-x-6 h-full items-end">
          <a className="text-slate-900 dark:text-slate-50 font-bold border-b-2 border-slate-900 dark:border-slate-50 pb-[17px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70" href="#">
            Patient Intake
          </a>
          <a className="text-slate-500 dark:text-slate-400 font-medium pb-[17px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70" href="#">
            Live Dashboard
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-status-non-urgent-bg rounded-DEFAULT border border-status-non-urgent-text border-opacity-20">
            <div className="w-2 h-2 rounded-full bg-status-non-urgent-text animate-pulse"></div>
            <span className="font-label-caps text-status-non-urgent-text">LIVE</span>
          </div>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT">
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:opacity-70 p-1 rounded-DEFAULT">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 flex justify-around py-3">
        <a className="flex flex-col items-center text-primary" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
          <span className="text-[10px] font-semibold mt-1">Intake</span>
        </a>
        <a className="flex flex-col items-center text-slate-500" href="#">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium mt-1">Dashboard</span>
        </a>
      </nav>

      {/* Main Content Canvas */}
      <main className="p-container-padding max-w-5xl mx-auto space-y-grid-gutter pb-24 md:pb-container-padding mt-14 md:mt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Emergency Room Triage</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Log patient arrival and compute initial severity.</p>
          </div>
          <div className="font-data-tabular text-data-tabular text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-DEFAULT border border-outline-variant">
            ID: HS-9938-A
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter">
          {/* Left Column: Form */}
          <div className="lg:col-span-8 space-y-grid-gutter">
            {/* Section A: Patient Info */}
            <section className="bg-surface-container-lowest rounded-DEFAULT border border-border-light p-4 shadow-sm">
              <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">person</span>
                Patient Identity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Full Name</label>
                  <input className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" type="text" defaultValue="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Age</label>
                    <input className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" type="number" defaultValue="54" />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Gender</label>
                    <select className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Arrival Time</label>
                  <input className="w-full md:w-1/2 bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" type="time" defaultValue="14:23" />
                </div>
              </div>
            </section>

            {/* Section B: Vitals */}
            <section className="bg-surface-container-lowest rounded-DEFAULT border border-border-light p-4 shadow-sm">
              <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                Vitals
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">HR (bpm)</label>
                  <input className="w-full bg-status-urgent-bg border border-status-urgent-text border-opacity-30 rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-status-urgent-text font-bold focus:outline-none focus:border-primary transition-colors" type="number" defaultValue="115" />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">BP (mmHg)</label>
                  <input className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary transition-colors" type="text" defaultValue="160/95" />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Temp (°C)</label>
                  <input className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary transition-colors" step="0.1" type="number" defaultValue="37.2" />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">SpO2 (%)</label>
                  <input className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-data-tabular text-data-tabular text-on-surface focus:outline-none focus:border-primary transition-colors" type="number" defaultValue="94" />
                </div>
              </div>
            </section>

            {/* Section C: Chief Complaint */}
            <section className="bg-surface-container-lowest rounded-DEFAULT border border-border-light p-4 shadow-sm">
              <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">description</span>
                Chief Complaint
              </h2>
              <textarea className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" rows="4" defaultValue="Patient complains of severe, crushing chest pain radiating to the left arm and jaw. Started 45 minutes ago. Diaphoretic upon arrival."></textarea>
            </section>

            <button className="w-full bg-primary text-on-primary font-headline-md text-headline-md py-3 px-4 rounded-DEFAULT hover:bg-surface-tint transition-colors flex items-center justify-center gap-2">
              Submit and triage patient
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          {/* Right Column: AI Triage Result (Simulated Post-Submit State) */}
          <div className="lg:col-span-4">
            <div className="bg-status-critical-bg border border-status-critical-text border-opacity-30 rounded-DEFAULT p-4 sticky top-20 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-status-critical-text text-[24px]">warning</span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-status-critical-text mb-1">Critical Priority</h3>
                  <p className="font-body-sm text-body-sm text-on-surface mb-3">AI Analysis indicates immediate medical intervention required.</p>
                  
                  <div className="space-y-2">
                    <div className="bg-white bg-opacity-50 px-3 py-2 rounded-DEFAULT border border-status-critical-text border-opacity-20 flex justify-between items-center">
                      <span className="font-label-caps text-label-caps text-status-critical-text uppercase">Primary Flag</span>
                      <span className="font-data-tabular text-data-tabular text-status-critical-text font-bold">Possible acute MI</span>
                    </div>
                    <div className="bg-white bg-opacity-50 px-3 py-2 rounded-DEFAULT border border-status-critical-text border-opacity-20 flex justify-between items-center">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Time to Action</span>
                      <span className="font-data-tabular text-data-tabular text-on-surface font-bold">&lt; 5 minutes</span>
                    </div>
                  </div>
                  
                  <button className="mt-4 w-full bg-status-critical-text text-white font-data-tabular text-data-tabular py-2 px-4 rounded-DEFAULT hover:bg-opacity-90 transition-colors">
                    Page Cardiology Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
