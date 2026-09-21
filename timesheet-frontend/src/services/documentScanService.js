// src/services/documentScanService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API 
  ? `${process.env.REACT_APP_API}/documents` 
  : 'http://localhost:5000/api/documents';

// ฟังก์ชันดึง Token จาก LocalStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 1. ส่งไฟล์ไปสแกนและบันทึก
export const uploadAndScanDocument = async (file, docCategory, userId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docCategory', docCategory);
    if (userId) {
      formData.append('userId', userId);
    }

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
export const getUserDocumentHistory = async (userId) => {
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

// 3. ยกเลิกเอกสารของนักศึกษา
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

// 4. ดึงเอกสารทั้งหมดสำหรับ Admin/อาจารย์
export const getAllDocumentsForReview = async (params = {}) => {
  try {
    const { status, search, docCategory } = params;
    const response = await axios.get(`${API_URL}/admin/all`, {
      headers: getAuthHeaders(),
      params: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(search ? { search } : {}),
        ...(docCategory ? { docCategory } : {}),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getAllDocumentsForReview:', error);
    throw error.response?.data || error;
  }
};

// 5. อนุมัติ / ไม่อนุมัติเอกสาร พร้อมหมายเหตุ
export const reviewDocument = async (documentId, status, remark = '') => {
  try {
    const response = await axios.put(
      `${API_URL}/review/${documentId}`,
      { status, remark },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error in reviewDocument:', error);
    throw error.response?.data || error;
  }
};