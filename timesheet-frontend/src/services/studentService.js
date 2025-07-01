import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const getAllStudents = (token) => {
  return axios.get(`${API_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteStudent = (id, token) => {
  return axios.delete(`${API_URL}/students/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
