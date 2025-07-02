import axios from 'axios';

export const getAllStudents = (token) => {
  return axios.get('/api/users/students', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteStudent = (id, token) => {
  return axios.delete(`/api/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateStudent = (id, data, token) => {
  return axios.put(`/api/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// services/studentService.js
export const getAdminSummary = (token) => {
  return axios.get('/api/users/admin/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
};



