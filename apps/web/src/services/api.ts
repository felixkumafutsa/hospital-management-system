import axios from 'axios';
import { 
  CreateAncInput, 
  CreateDeliveryInput, 
  CreatePostnatalInput, 
  CreateScheduleInput, 
  CreateTimeOffInput 
} from '../../../../packages/types';

const API_BASE_URL = (() => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // If no env var is set and we're in production, use your API domain
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://hospital-management-system-api-felixkumafutsas-projects.vercel.app/api/v1';
  }
  
  // Default to localhost for development
  return 'http://localhost:4000/api/v1';
})();

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

// Maternity API calls - ANC Records
export const createAncRecord = (data: CreateAncInput) => api.post('/maternity/anc', data);
export const getAncRecords = (params?: any) => api.get('/maternity/anc', { params });
export const getAncRecord = (id: string) => api.get(`/maternity/anc/${id}`);
export const getAncRecordsForPatient = (patientId: string) => api.get(`/maternity/anc/patient/${patientId}`);
export const updateAncRecord = (id: string, data: Partial<CreateAncInput>) => api.put(`/maternity/anc/${id}`, data);

// Maternity API calls - Delivery Records
export const createDeliveryRecord = (data: CreateDeliveryInput) => api.post('/maternity/deliveries', data);
export const getDeliveryRecords = (params?: any) => api.get('/maternity/deliveries', { params });
export const getDeliveryRecord = (id: string) => api.get(`/maternity/deliveries/${id}`);
export const getDeliveryRecordsForPatient = (patientId: string) => api.get(`/maternity/deliveries/patient/${patientId}`);

// Maternity API calls - Postnatal Records
export const createPostnatalRecord = (data: CreatePostnatalInput) => api.post('/maternity/postnatal', data);
export const getPostnatalRecords = (params?: any) => api.get('/maternity/postnatal', { params });
export const getPostnatalRecord = (id: string) => api.get(`/maternity/postnatal/${id}`);
export const getPostnatalRecordsForPatient = (patientId: string) => api.get(`/maternity/postnatal/patient/${patientId}`);

// Maternity Dashboard
export const getMaternityStats = () => api.get('/maternity/stats');

// Staff Scheduling API calls - Schedules
export const createSchedule = (data: CreateScheduleInput) => api.post('/scheduling', data);
export const getSchedules = (params?: any) => api.get('/scheduling', { params });
export const getSchedule = (id: string) => api.get(`/scheduling/${id}`);
export const getSchedulesForUser = (userId: string, startDate?: string, endDate?: string) => 
  api.get(`/scheduling/user/${userId}`, { params: { startDate, endDate } });
export const getSchedulesForDepartment = (department: string, date: string) => 
  api.get(`/scheduling/department/${department}/date/${date}`);
export const updateSchedule = (id: string, data: Partial<CreateScheduleInput>) => api.put(`/scheduling/${id}`, data);
export const deleteSchedule = (id: string) => api.delete(`/scheduling/${id}`);

// Staff Scheduling API calls - Time Off Requests
export const createTimeOffRequest = (data: CreateTimeOffInput) => api.post('/scheduling/timeoff', data);
export const getPendingTimeOffRequests = () => api.get('/scheduling/timeoff/pending');
export const getTimeOffRequestsForUser = (userId: string) => api.get(`/scheduling/timeoff/user/${userId}`);
export const processTimeOffRequest = (id: string, action: 'APPROVE' | 'REJECTED') => 
  api.post(`/scheduling/timeoff/${id}/process`, { action });

// Scheduling Dashboard
export const getSchedulingStats = () => api.get('/scheduling/stats');

// Appointments API calls - these are patient appointments, registered under /appointments
export const createAppointment = (appointmentData: any) => api.post('/appointments', appointmentData);
export const getAppointments = (params?: any) => api.get('/appointments', { params });
export const getAppointment = (id: string) => api.get(`/appointments/${id}`);
export const getPatientAppointments = (patientId: string) => api.get(`/appointments/patient/${patientId}`);
export const updateAppointmentStatus = (id: string, status: string) => api.put(`/appointments/${id}/status`, { status });
export const deleteAppointment = (id: string) => api.delete(`/appointments/${id}`);

// Prescription API calls
export const createPrescription = (prescriptionData: any) => api.post('/prescriptions', prescriptionData);
export const getPrescriptions = (params?: any) => api.get('/prescriptions', { params });
export const getPrescription = (id: string) => api.get(`/prescriptions/${id}`);
export const getPatientPrescriptions = (patientId: string) => api.get(`/prescriptions/patient/${patientId}`);
export const updatePrescriptionStatus = (id: string, status: string) => api.put(`/prescriptions/${id}/status`, { status });
export const deletePrescription = (id: string) => api.delete(`/prescriptions/${id}`);

// Pharmacy/Inventory API calls
export const createMedicine = (medicineData: any) => api.post('/pharmacy/medicines', medicineData);
export const getMedicines = (params?: any) => api.get('/pharmacy/medicines', { params });
export const getMedicine = (id: string) => api.get(`/pharmacy/medicines/${id}`);
export const searchMedicines = (query: string) => api.get('/pharmacy/medicines/search', { params: { q: query } });
export const getLowStockMedicines = () => api.get('/pharmacy/lowstock');
export const createMedicineBatch = (batchData: any) => api.post('/pharmacy/medicines/batches', batchData);
export const getMedicineBatch = (id: string) => api.get(`/pharmacy/medicines/batches/${id}`);
export const recordTransaction = (transactionData: any) => api.post('/pharmacy/transactions', transactionData);
export const getTransactions = (params?: any) => api.get('/pharmacy/transactions', { params });

// Laboratory API calls
export const createLabTest = (labTestData: any) => api.post('/lab/tests', labTestData);
export const getLabTests = (params?: any) => api.get('/lab/tests', { params });
export const getLabTest = (id: string) => api.get(`/lab/tests/${id}`);
export const createLabRequest = (labRequestData: any) => api.post('/lab/requests', labRequestData);
export const getLabRequests = (params?: any) => api.get('/lab/requests', { params });
export const getLabRequest = (id: string) => api.get(`/lab/requests/${id}`);
export const getPatientLabRequests = (patientId: string) => api.get(`/lab/requests/patient/${patientId}`);
export const updateLabRequestStatus = (id: string, status: string) => api.put(`/lab/requests/${id}/status`, { status });
export const addLabResult = (id: string, resultData: any) => api.put(`/lab/requests/${id}/result`, resultData);

// User Management API calls
export const createUser = (userData: any) => api.post('/users', userData);
export const getAllUsers = (params?: any) => api.get('/users', { params });
export const getUser = (id: string) => api.get(`/users/${id}`);
export const searchUsers = (query: string) => api.get('/users/search', { params: { q: query } });
export const getUsersByRole = (role: string) => api.get(`/users/role/${role}`);
export const updateUser = (id: string, userData: any) => api.put(`/users/${id}`, userData);
export const deactivateUser = (id: string) => api.patch(`/users/${id}/deactivate`);

// Billing/Finance API calls
export const createInvoice = (invoiceData: any) => api.post('/finance/invoices', invoiceData);
export const getInvoices = (params?: any) => api.get('/finance/invoices', { params });
export const getInvoice = (id: string) => api.get(`/finance/invoices/${id}`);
export const getPatientInvoices = (patientId: string) => api.get(`/finance/patient/${patientId}/invoices`);
export const recordPayment = (invoiceId: string, paymentData: any) => api.post(`/finance/invoices/${invoiceId}/payments`, paymentData);
export const getFinanceStats = () => api.get('/finance/stats');
export const getRevenue = (params?: any) => api.get('/finance/revenue', { params });
export const getRecentInvoices = (limit?: number) => api.get('/finance/invoices/recent', { params: { limit } });

export default api;