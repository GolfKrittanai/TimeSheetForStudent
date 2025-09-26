import axios from "axios";

const API_URL = process.env.REACT_APP_API;

export const getMyTimeSheets = (token) => {
  return axios.get(`${API_URL}/timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createTimeSheet = (data, token) => {
  return axios.post(`${API_URL}/timesheets`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteTimeSheet = (id, token) => {
  return axios.delete(`${API_URL}/timesheets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// เพิ่มฟังก์ชันสำหรับแก้ไข Timesheet
export const updateTimeSheet = (id, data, token) => {
  return axios.put(`${API_URL}/timesheets/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ✅ เพิ่ม: ฟังก์ชันตรวจสอบการบันทึกซ้ำ (สำหรับใช้ใน StudentDashboard.js)
export const checkTimesheetExists = async (date, token) => {
  const response = await axios.get(`${API_URL}/timesheets/check-existence`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      date: date,
    },
  });

  // คืนค่า exists: true/false ที่ได้จาก Backend
  return response.data.exists;
};
