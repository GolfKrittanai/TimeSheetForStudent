import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
        }
      />
      <Route
        path="/student"
        element={
          user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />
        }
      />
    </Routes>
  );
}

export default App;
