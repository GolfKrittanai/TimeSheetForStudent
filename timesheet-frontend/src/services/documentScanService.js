// src/services/documentScanService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/documents';

// ฟังก์ชันดึง Token จาก LocalStorage (ถ้ามีระบบ Auth)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 1. ส่งไฟล์ไปสแกนและบันทึก
export const uploadAndScanDocument = async (file, docCategory, userId = 1) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docCategory', docCategory);
    formData.append('userId', userId);

    const response = await axios.post(`${API_URL}/upload-scan`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in uploadAndScanDocument:', error);
    throw error.response?.data || error;
  }
};

// 2. ดึงประวัติการสแกนเอกสาร
export const getUserDocumentHistory = async (userId = 1) => {
  try {
    const response = await axios.get(`${API_URL}/history/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error in getUserDocumentHistory:', error);
    throw error.response?.data || error;
  }
};

// เพิ่มเข้าไปใน documentScanService.js
export const cancelUserDocument = async (documentId) => {
  try {
    const response = await axios.delete(`${API_URL}/cancel/${documentId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error in cancelUserDocument:', error);
    throw error.response?.data || error;
  }
};