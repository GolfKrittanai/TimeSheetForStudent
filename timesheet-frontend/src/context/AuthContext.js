import React, { createContext, useContext, useState, useEffect } from 'react';

// สร้าง Context สำหรับเก็บข้อมูล Authentication
const AuthContext = createContext();

// สร้าง Provider เพื่อห่อแอป หรือ component ต้นทาง เพื่อให้ทุก component ที่อยู่ข้างในใช้งานข้อมูล auth ได้
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // เก็บข้อมูลผู้ใช้ เช่น { id, name, role }
  const [token, setToken] = useState(null); // เก็บ token ที่ได้จากการ login

  // useEffect รันตอน component โหลดครั้งแรก (mount)
  // เพื่อดึงข้อมูล token และ user ที่เก็บไว้ใน localStorage (ถ้ามี) มาใช้ต่อ
  useEffect(() => {
    const token = localStorage.getItem('token'); // ดึง token จาก localStorage
    const user = localStorage.getItem('user');   // ดึง user จาก localStorage
    if (token && user) {
      setToken(token);            // อัพเดต state token
      setUser(JSON.parse(user));  // แปลง JSON string กลับเป็น object แล้วอัพเดต state user
    }
  }, []);

  // ฟังก์ชัน login จะถูกเรียกเมื่อผู้ใช้ล็อกอินสำเร็จ
  // ทำหน้าที่เก็บ token และ user ลง state และ localStorage
  const login = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);               // เก็บ token ใน localStorage
    localStorage.setItem('user', JSON.stringify(user)); // แปลง object user เป็น string แล้วเก็บใน localStorage
  };

  // ฟังก์ชัน logout ล้างข้อมูลผู้ใช้และ token ทั้งใน state และ localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ส่งข้อมูล user, token และฟังก์ชัน login, logout ผ่าน Context ให้ component ลูกใช้งานได้
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook สำหรับเรียกใช้ข้อมูล AuthContext ใน component ต่าง ๆ ได้ง่าย
export const useAuth = () => useContext(AuthContext);
