export const BACKEND_URL = "http://localhost:5000";
export const SOCKET_URL = "http://localhost:5000";

export const API_ROUTES = {
  // Patients
  triage:     `${BACKEND_URL}/api/patients/triage`,
  active:     `${BACKEND_URL}/api/patients/active`,
  status:     (id) => `${BACKEND_URL}/api/patients/${id}/status`,
  // Auth
  register:   `${BACKEND_URL}/api/auth/register`,
  login:      `${BACKEND_URL}/api/auth/login`,
  google:     `${BACKEND_URL}/api/auth/google`,
  assignRole: `${BACKEND_URL}/api/auth/assign-role`,
  // Dispatch
  dispatchLive: `${BACKEND_URL}/api/dispatch/hospitals/live`,
  dispatchRoute: `${BACKEND_URL}/api/dispatch/route`,
  dispatchConfirm: `${BACKEND_URL}/api/dispatch/dispatch`,
};
