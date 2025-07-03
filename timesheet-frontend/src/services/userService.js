import axios from 'axios';

const API_BASE = 'http://localhost:5000/api'; // เปลี่ยนตาม URL backend ของคุณ

export const getUserProfile = (token) =>
  axios.get(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateUserProfile = (data, token) =>
  axios.put(`${API_BASE}/profile`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const changePassword = (currentPassword, newPassword, token) =>
  axios.put(
    `${API_BASE}/profile/change-password`,
    { currentPassword, newPassword },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
