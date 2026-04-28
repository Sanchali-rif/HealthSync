import React from 'react';

export default function LoadingScreen() {
  return (
    <>
      {/* ── Keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes hs-breathing {
          0%, 100% { transform: scale(1);    opacity: 1;    }
          50%       { transform: scale(1.05); opacity: 0.95; }
        }

        @keyframes hs-pulse-text {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.5; }
        }

        @keyframes hs-progress {
          0%   { width: 0%;   margin-left: 0%;   }
          50%  { width: 40%;  margin-left: 30%;  }
          100% { width: 0%;   margin-left: 100%; }
        }

        .hs-loader-root {
          position: fixed;
          inset: 0;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                       Helvetica, Arial, sans-serif;
        }

        .hs-loader-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 1.5rem;
          max-width: 28rem;
          width: 100%;
        }

        .hs-logo-wrap {
          animation: hs-breathing 4s ease-in-out infinite;
          filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.08));
        }

        .hs-logo-img {
          width: 16rem;
          height: 16rem;
          object-fit: contain;
        }

        @media (min-width: 768px) {
          .hs-logo-img {
            width: 20rem;
            height: 20rem;
          }
        }

        .hs-info {
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .hs-status-text {
          color: #6b7280;
          font-size: 1.125rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          margin: 0;
          animation: hs-pulse-text 2.5s ease-in-out infinite;
        }

        @media (min-width: 768px) {
          .hs-status-text { font-size: 1.25rem; }
        }

        .hs-bar-track {
          position: relative;
          width: 12rem;
          height: 4px;
          background: #f3f4f6;
          border-radius: 9999px;
          overflow: hidden;
        }

        .hs-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 30%;
          background: #60a5fa;
          border-radius: 9999px;
          animation: hs-progress 3s ease-in-out infinite;
        }
      `}</style>

      {/* ── Layout ────────────────────────────────────────── */}
      <div className="hs-loader-root">
        <main className="hs-loader-inner">

          {/* Central image — breathing animation */}
          <div className="hs-logo-wrap">
            <img
              src="/loadingscreen.jpg"
              alt="HealthSync Loading"
              className="hs-logo-img"
            />
          </div>

          {/* Status text + progress bar */}
          <div className="hs-info">
            <p className="hs-status-text">
              Synchronizing your health data...
            </p>

            <div className="hs-bar-track">
              <div className="hs-bar-fill" />
            </div>
          </div>

        </main>
      </div>
    </>
  );
}



