import axios from 'axios';

const API_URL = 'http://localhost:5000/api/students'; // เปลี่ยนตาม backend จริง

// ดึงนักศึกษาทั้งหมด (เฉพาะ admin เข้าถึงได้)
export const getAllStudents = async (token) => {
  return await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ลบนักศึกษาจาก id
export const deleteStudent = async (id, token) => {
  return await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
