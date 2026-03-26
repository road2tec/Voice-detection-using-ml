import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
});

export const seedUsers = async () => {
  const { data } = await api.post('/api/users/seed');
  return data;
};

export const signup = async ({ name, email, password }) => {
  const { data } = await api.post('/api/auth/signup', { name, email, password });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get('/api/users');
  return data;
};

export const getAdminAlerts = async () => {
  const { data } = await api.get('/api/admin/alerts');
  return data;
};

export const getUserAlerts = async (userId) => {
  const { data } = await api.get(`/api/users/${userId}/alerts`);
  return data;
};

export const analyzeAudio = async ({ userId, audioBlob, latitude, longitude }) => {
  const formData = new FormData();
  const extension = audioBlob.type.includes('wav') ? 'wav' : 'webm';
  formData.append('audio', audioBlob, `recording.${extension}`);
  formData.append('userId', userId);
  if (latitude) formData.append('latitude', latitude);
  if (longitude) formData.append('longitude', longitude);

  const { data } = await api.post('/api/audio/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
