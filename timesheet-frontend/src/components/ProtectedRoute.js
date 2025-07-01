import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {ReactNode} children - หน้าที่จะโชว์
 * @param {string[]} allowedRoles - บทบาทที่สามารถเข้าได้ เช่น ['admin']
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />; // ยังไม่ได้ login → redirect ไปหน้า Login
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // ไม่ตรง role → redirect
  }

  return children;
}

export default ProtectedRoute;
