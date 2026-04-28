import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { BACKEND_URL, API_ROUTES } from '../config/api';

function Login({ isDarkMode, setIsDarkMode }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('nurse');         // toggle selection: 'nurse' | 'doctor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin');        // 'signin' | 'register'


  // Capitalize the toggle value to match backend expectations
  const getCapitalizedRole = () => (role === 'nurse' ? 'Nurse' : 'Doctor');

  // Navigate based on role string returned from backend
  // Always route through hospital selection first
  const navigateByRole = (returnedRole) => {
    localStorage.setItem('hs_role', returnedRole);
    navigate('/select-hospital');
  };

  // ─── Sign In ─────────────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Call backend — source of truth for role
      const response = await axios.post(API_ROUTES.login, { email, password });
      const returnedRole = response.data.role; // 'Nurse' | 'Doctor'

      // 2. Validate that the selected toggle matches the account's actual role
      if (returnedRole !== getCapitalizedRole()) {
        setError(
          `This account is registered as a ${returnedRole}. Please select ${returnedRole} role.`
        );
        return;
      }

      // 3. Sign in on the Firebase client so auth.currentUser stays valid
      await signInWithEmailAndPassword(auth, email, password);

      // 4. Persist session and navigate
      localStorage.setItem('hs_token', response.data.token);
      navigateByRole(returnedRole);
    } catch (err) {
      const backendMsg = err.response?.data?.error;
      setError(backendMsg || getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ────────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const capitalizedRole = getCapitalizedRole();

      // 1. Create user in Firebase via backend (sets custom claim)
      await axios.post(API_ROUTES.register, {
        email,
        password,
        role: capitalizedRole,
      });

      // 2. Sign in on the Firebase client
      await signInWithEmailAndPassword(auth, email, password);

      // 3. Persist and navigate
      navigateByRole(capitalizedRole);
    } catch (err) {
      const backendMsg = err.response?.data?.error;
      setError(backendMsg || getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Sign In ───────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError('');

    // Role must be selected on the toggle before Google sign-in
    const capitalizedRole = getCapitalizedRole();
    if (!capitalizedRole) {
      setError('Please select Nurse or Doctor first');
      return;
    }

    setLoading(true);
    try {
      // 1. Firebase popup — signs user into Firebase client
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 2. Send idToken + selected role to backend
      const response = await axios.post(API_ROUTES.google, {
        idToken,
        role: capitalizedRole,
      });

      if (response.data.needsRole) {
        // Should not happen since we always send a role,
        // but guard against it just in case
        setError('Please select your role (Nurse or Doctor) before signing in with Google');
        return;
      }

      // Role confirmed — validate it matches the selected toggle
      const returnedRole = response.data.role;
      if (returnedRole !== capitalizedRole) {
        setError(`This Google account is registered as a ${returnedRole}. Please select ${returnedRole} role.`);
        return;
      }
      localStorage.setItem('hs_token', response.data.token || idToken);
      navigateByRole(returnedRole);
    } catch (err) {
      const backendMsg = err.response?.data?.error;
      // Show the real error message — fall back to friendly message only for known codes
      setError(backendMsg || getFriendlyError(err.code) + (err.message ? ` (${err.message})` : ''));
    } finally {
      setLoading(false);
    }
  };

  // ─── Error helper ─────────────────────────────────────────────────────────────
  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const isRegister = mode === 'register';

  // ─── Main Login / Register Screen ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" /></svg>
          ) : (
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
      </div>

      <div className="max-w-md w-full px-6 py-8">
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }} className="mb-6">
          <img src="/nav.JPG" alt="HealthSync" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block' }} />
        </div>
        <h2 className="text-[32px] font-bold text-gray-900 dark:text-white mb-1">
          {isRegister ? 'Create Account' : 'Sign in'}
        </h2>
        <p className="text-base text-gray-800 dark:text-gray-300 mb-6">
          {isRegister ? 'Already have an account? ' : 'or '}
          <button
            type="button"
            onClick={() => { setMode(isRegister ? 'signin' : 'register'); setError(''); }}
            className="text-[#0d6efd] dark:text-blue-400 hover:underline"
          >
            {isRegister ? 'Sign in' : 'create an account'}
          </button>
        </p>

        <form onSubmit={isRegister ? handleRegister : handleSignIn} className="space-y-4">
          {/* Role Selector */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-colors ${role === 'nurse' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setRole('nurse')}
            >
              Nurse
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-colors ${role === 'doctor' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setRole('doctor')}
            >
              Doctor
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 mb-4">Select your role before signing in</p>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 rounded-none border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d6efd] dark:focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 rounded-none border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d6efd] dark:focus:border-blue-500 transition-colors mt-[-1px]"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {!isRegister && (
            <div className="flex items-center pt-2">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[#0d6efd] focus:ring-[#0d6efd] border-gray-400 rounded-sm dark:border-gray-600 dark:bg-gray-800" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
          )}

          <div className="pt-2 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0d6efd] hover:bg-blue-700 disabled:opacity-60 text-white font-medium focus:outline-none transition-colors"
            >
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign in')}
            </button>

            {!isRegister && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 text-gray-800 dark:text-gray-200 font-medium focus:outline-none transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>

          {!isRegister && (
            <div className="pt-2 text-left">
              <Link to="/forgot-password" className="text-sm font-medium text-[#0d6efd] dark:text-blue-400 hover:underline">
                Forgotten your password?
              </Link>
            </div>
          )}
        </form>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 font-bold">Skip Login</p>
          <button
            onClick={() => navigate('/regional')}
            className="w-full py-4 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black text-sm tracking-[0.2em] uppercase rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-slate-700"
          >
            <span className="material-symbols-outlined text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
            Enter Dispatch
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;
