import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Patient API calls
export const createPatient = (patientData: any) => api.post('/patients', patientData);
export const getPatients = () => api.get('/patients');
export const getPatient = (id: string) => api.get(`/patients/${id}`);
export const updatePatient = (id: string, patientData: any) => api.put(`/patients/${id}`, patientData);
export const deletePatient = (id: string) => api.delete(`/patients/${id}`);

// Visit API calls
export const createVisit = (visitData: any) => api.post('/visits', visitData);
export const getVisits = () => api.get('/visits');
export const getVisit = (id: string) => api.get(`/visits/${id}`);
export const updateVisitStatus = (id: string, status: string) => api.patch(`/visits/${id}/status`, { status });
export const getQueue = () => api.get('/visits/queue');

// Auth API calls
export const login = (credentials: { email: string; password: string }) => api.post('/auth/login', credentials);
export const refreshToken = (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken });
export const logout = () => api.post('/auth/logout');

export default api;