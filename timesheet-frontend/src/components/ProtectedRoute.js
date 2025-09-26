import React from 'react';
import { Navigate } from 'react-router-dom'; // ใช้เปลี่ยนหน้า (redirect)
import { useAuth } from '../context/AuthContext'; // ดึงข้อมูลผู้ใช้จาก Context

/**
 * Component สำหรับป้องกันหน้าเพจ ให้เข้าถึงได้เฉพาะผู้ใช้ที่ล็อกอินและมีบทบาทที่กำหนด
 * 
 * @param {ReactNode} children - หน้าที่ต้องการแสดงถ้าผ่านการตรวจสอบ
 * @param {string[]} allowedRoles - รายการบทบาท (roles) ที่สามารถเข้าถึงหน้าได้ เช่น ['admin']
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth(); // ดึงข้อมูลผู้ใช้ปัจจุบัน

  // ถ้ายังไม่ได้ล็อกอิน (ไม่มี user)
  if (!user) {
    return <Navigate to="/" replace />; // รีไดเร็กไปหน้า Login
  }

  // ถ้า user มีบทบาทไม่ตรงกับที่อนุญาต
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // รีไดเร็กไปหน้า Login หรือหน้าอื่นที่เหมาะสม
  }

  // ถ้าผ่านหมดแล้ว แสดง component ที่ส่งเข้ามา (children)
  return children;
}

export default ProtectedRoute;
