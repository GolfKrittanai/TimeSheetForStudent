import axios from 'axios';

export const getStudentTimesheetById = (id, token) => {
  return axios.get(`/api/users/students/${id}/timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
