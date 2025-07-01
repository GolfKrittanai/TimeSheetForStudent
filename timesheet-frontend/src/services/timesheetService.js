import axios from 'axios';

const API_URL = 'http://localhost:5000/api/timesheet'; // เปลี่ยนตาม backend จริง

export const getMyTimeSheets = async (token) => {
  return await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createTimeSheet = async (data, token) => {
  return await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteTimeSheet = async (id, token) => {
  return await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
