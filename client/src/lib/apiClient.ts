import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:6767/api',
  withCredentials: true,
});

export default apiClient;
