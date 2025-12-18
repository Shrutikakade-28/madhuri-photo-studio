// src/api/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // your backend

export const signup = (data) => axios.post(`${API_URL}/signup`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const adminLogin = (data) => axios.post('http://localhost:5000/api/admin/login', data);
