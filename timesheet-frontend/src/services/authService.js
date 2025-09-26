import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const loginUser = (data) => {
  return axios.post(`${API_URL}/auth/login`, data);
};

export const registerUser = (data) => {
  return axios.post(`${API_URL}/auth/register`, data);
};

export const forgotPassword = (data) => {
  return axios.post(`${API_URL}/auth/forgot-password`, data);
};

export const resetPassword = (data) => {
  return axios.post(`${API_URL}/auth/reset-password`, data);
};