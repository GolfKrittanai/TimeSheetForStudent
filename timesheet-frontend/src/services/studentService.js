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

export const getMyProfile = (token) => {
  return axios.get('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
};
