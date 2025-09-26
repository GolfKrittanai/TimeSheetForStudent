import React, { createContext, useContext, useState, useEffect } from 'react';

// สร้าง Context สำหรับเก็บข้อมูล auth
const AuthContext = createContext();

// สร้าง Provider สำหรับห่อ component หลัก
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // ข้อมูลผู้ใช้ เช่น id, name, role
  const [token, setToken] = useState(null); // token JWT

  // โหลดข้อมูลจาก localStorage ตอนแอปโหลด
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการแปลง user จาก localStorage:', err);
        localStorage.removeItem('user'); // ลบข้อมูลที่ผิดพลาดทิ้ง
      }
    }
  }, []);

  // ฟังก์ชัน login - บันทึก token และ user ลง state และ localStorage
  const login = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  // ฟังก์ชัน logout - ล้างข้อมูลออกจาก state และ localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// hook สำหรับใช้ auth context ได้ง่าย
export const useAuth = () => useContext(AuthContext);
