export const BACKEND_URL = "http://localhost:5000";
export const SOCKET_URL = "http://localhost:5000";

export const API_ROUTES = {
  // Patients
  triage:  `${BACKEND_URL}/api/patients/triage`,
  active:  `${BACKEND_URL}/api/patients/active`,
  status:  (id) => `${BACKEND_URL}/api/patients/${id}/status`,
};
