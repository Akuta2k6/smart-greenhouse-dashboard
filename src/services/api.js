
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getTelemetryLatest = async (zoneId) => {
  const response = await api.get(`/greenhouse/zones/${zoneId}/telemetry/latest`);
  return response.data;
};

export const getZoneActuators = async (zoneId) => {
  const response = await api.get(`/greenhouse/zones/${zoneId}/actuators`);
  return response.data;
};

export const controlActuator = async (payload) => {
  const response = await api.post('/greenhouse/actuators/control', payload);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export default api;
