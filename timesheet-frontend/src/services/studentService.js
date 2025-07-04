import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const getAllStudents = (token) => {
  return axios.get(`${API_URL}/users/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteStudent = (id, token) => {
  return axios.delete(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateStudent = (id, data, token) => {
  return axios.put(`${API_URL}/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// services/studentService.js
export const getAdminSummary = (token) => {
  return axios.get(`${API_URL}/users/admin/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};



