import axios from 'axios';

const API_URL = process.env.REACT_APP_API;

export const getStudentTimesheetById = (id, token) => {
  return axios.get(`${API_URL}/users/students/${id}/timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateStudentTimesheetById = (id, data, token) => {
  return axios.put(`${API_URL}/admin/timesheet/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteStudentTimesheetById = (id, token) => {
  return axios.delete(`${API_URL}/admin/timesheet/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
