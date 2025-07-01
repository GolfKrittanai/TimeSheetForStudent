import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const getMyTimeSheets = (token) => {
  return axios.get(`${API_URL}/timesheet/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createTimeSheet = (data, token) => {
  return axios.post(`${API_URL}/timesheet`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteTimeSheet = (id, token) => {
  return axios.delete(`${API_URL}/timesheet/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
