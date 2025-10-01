import axios from 'axios';

const API_URL = process.env.REACT_APP_API; // เปลี่ยนตาม URL backend ของคุณ

export const getUserProfile = (token) =>
  axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateUserProfile = (data, token, isFormData = false) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (isFormData) {
    headers['Content-Type'] = 'multipart/form-data';
  }

  return axios.put(`${API_URL}/profile`, data, { headers });
};

export const changePassword = (currentPassword, newPassword, token) =>
  axios.put(
    `${API_URL}/profile/change-password`,
    { currentPassword, newPassword },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

// อัปโหลดรูปโปรไฟล์ (ผ่าน BE ไป Supabase)
export const uploadAvatar = (file, token) => {
  const form = new FormData();
  form.append("profileImage", file); // ต้องชื่อ profileImage ให้ตรงกับ BE
  return axios.put(`${API_URL}/profile/upload-avatar`, form, {
    headers: { Authorization: `Bearer ${token}` }, // ไม่ต้องกำหนด Content-Type เอง
  });
};

