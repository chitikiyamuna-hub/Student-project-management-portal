import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10005,
  headers: {
    'Content-Type': 'application/json'
  }
});

let globalToastDispatcher = null;

/**
 * Register a global toast callback to receive centralized API errors.
 * @param {Function} dispatcher - (message, type) => void
 */
export const registerToastDispatcher = (dispatcher) => {
  globalToastDispatcher = dispatcher;
};

// Request Interceptor to automatically attach Student authentication headers
api.interceptors.request.use(
  (config) => {
    const sessionUser = localStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        if (parsed && parsed.email) {
          config.headers['x-student-email'] = parsed.email;
        }
      } catch (err) {
        console.error('Failed to parse current student session headers:', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for Centralized Error Handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errMsg = 'Something went wrong. Please check your connection.';
    
    if (error.response) {
      const responseData = error.response.data;
      if (responseData && responseData.error) {
        errMsg = responseData.error;
        if (responseData.details && Array.isArray(responseData.details)) {
          errMsg = `${responseData.error}: ${responseData.details.join('; ')}`;
        }
      }
    } else if (error.request) {
      errMsg = 'Network Error: Cannot connect to the server. Please verify the backend is running.';
    } else {
      errMsg = error.message;
    }

    console.log('[API Centralized Error System]:', errMsg);

    // Alert the user via toast notifications
    if (globalToastDispatcher) {
      globalToastDispatcher(errMsg, 'error');
    }

    return Promise.reject(new Error(errMsg));
  }
);

// API REST CRUD Operations
export const taskApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getStats: () => api.get('/stats'),
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (taskData) => api.post('/tasks', taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export default api;
