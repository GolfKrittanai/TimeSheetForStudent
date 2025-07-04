import axios from 'axios';

const API_URL = process.env.REACT_APP_API;  // ตรวจสอบให้แน่ใจว่า .env ตั้งค่าถูกต้อง

// ส่งคำขอล็อกอินผู้ใช้
export const loginUser = (data) => {
  return axios
    .post(`${API_URL}/auth/login`, data)
    .then((response) => {
      return response.data;  // ส่งข้อมูลจาก backend (JWT token และข้อมูลผู้ใช้)
    })
    .catch((error) => {
      // จัดการข้อผิดพลาด
      if (error.response) {
        // ถ้ามี response จาก backend
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      } else if (error.request) {
        // ถ้าไม่มี response จาก backend
        console.error('Error request:', error.request);
        throw new Error('ไม่สามารถเชื่อมต่อกับ backend');
      } else {
        // หากเกิดข้อผิดพลาดในขณะที่ตั้งค่าคำขอ
        console.error('Error', error.message);
        throw new Error('เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    });
};

// ส่งคำขอลงทะเบียนผู้ใช้ใหม่
export const registerUser = (data) => {
  return axios
    .post(`${API_URL}/auth/register`, data)
    .then((response) => {
      return response.data;  // ส่งข้อมูลจาก backend (ข้อมูลผู้ใช้ใหม่)
    })
    .catch((error) => {
      // จัดการข้อผิดพลาด
      if (error.response) {
        // ถ้ามี response จาก backend
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      } else if (error.request) {
        // ถ้าไม่มี response จาก backend
        console.error('Error request:', error.request);
        throw new Error('ไม่สามารถเชื่อมต่อกับ backend');
      } else {
        // หากเกิดข้อผิดพลาดในขณะที่ตั้งค่าคำขอ
        console.error('Error', error.message);
        throw new Error('เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    });
};
