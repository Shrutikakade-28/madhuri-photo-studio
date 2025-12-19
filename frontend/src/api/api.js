// src/api/api.js
import axios from 'axios';

// Default to localhost in development for convenience
const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
const AUTH_URL = `${API_BASE}/api/auth`;
const ADMIN_URL = `${API_BASE}/api/admin`;

export const signup = (data) => axios.post(`${AUTH_URL}/register`, data);
export const login = (data) => axios.post(`${AUTH_URL}/login`, data);
export const adminLogin = (data) => axios.post(`${ADMIN_URL}/login`, data);
