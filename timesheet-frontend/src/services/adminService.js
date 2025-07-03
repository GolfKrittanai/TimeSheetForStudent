import axios from 'axios';

export const getStudentTimesheetById = (id, token) => {
  return axios.get(`/api/users/students/${id}/timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateStudentTimesheetById = (id, data, token) => {
  return axios.put(`/api/admin/timesheet/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteStudentTimesheetById = (id, token) => {
  return axios.delete(`/api/admin/timesheet/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
