import axios from "axios";
import { auth } from "../config/firebase";
import { BACKEND_URL } from "../config/api";

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

// Request interceptor — attach Firebase ID token to every request
axiosInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Sign out and let App.jsx's onAuthStateChanged redirect to login
      auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
