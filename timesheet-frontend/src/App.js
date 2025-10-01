import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AddAccount from './pages/Admin/AddAccount'; 
// 💡 เพิ่ม import สำหรับ Teacher Dashboard
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./context/AuthContext";
import ReportExport from "./pages/ReportExport";
import { CssBaseline } from "@mui/material";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TimesheetHistoryPage from "./pages/TimesheetHistoryPage"; 
// 💡 เพิ่ม import สำหรับหน้าดู Timesheet ของนักศึกษาโดย Admin/Teacher
import StudentTimesheetView from "./pages/StudentTimesheetView"; 


function App() {
  const { user } = useAuth();

  return (
    <>
      <CssBaseline />
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <LoginPage />
            ) : user.role === "admin" ? (
              <Navigate to="/admin" />
            ) : user.role === "teacher" ? ( // 💡 เพิ่มเงื่อนไขสำหรับ Teacher
              <Navigate to="/teacher" />
            ) : (
              <Navigate to="/student" />
            )
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ---------------- Admin routes ---------------- */}
        {user?.role === "admin" && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/add-account" element={<AddAccount />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportExport user={user} />} />
            
            {/* 💡 Route สำหรับดู Timesheet ของนักศึกษา (ใช้ร่วมกับ Teacher) */}
            <Route 
              path="/admin/student/:id/timesheets" 
              element={<StudentTimesheetView />} 
            />
            
            <Route path="*" element={<Navigate to="/admin" />} />
          </>
        )}

        {/* ---------------- Teacher routes ---------------- */}
        {user?.role === "teacher" && ( // 💡 เพิ่มเงื่อนไขสำหรับ Teacher
          <>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportExport user={user} />} />
            
            {/* 💡 Route สำหรับดู Timesheet ของนักศึกษา (ใช้ร่วมกับ Admin) */}
            <Route 
              path="/teacher/student/:id/timesheets" 
              element={<StudentTimesheetView />} 
            />

            <Route path="*" element={<Navigate to="/teacher" />} />
          </>
        )}

        {/* ---------------- Student routes ---------------- */}
        {user?.role === "student" && (
          <>
            <Route path="/student" element={<StudentDashboard />} />
            <Route
              path="/student/timesheet-history"
              element={<TimesheetHistoryPage />}
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/student/export"
              element={<ReportExport user={user} />}
            />
            <Route path="*" element={<Navigate to="/student" />} />
          </>
        )}

        {/* Fallback routes (สำหรับกรณีที่ผู้ใช้ล็อกอินอยู่แต่พิมพ์ URL มั่ว) */}
        {/*
          เนื่องจากมีการจัดการ Fallback (*) ภายในแต่ละ Block ของ Role แล้ว
          ส่วนนี้อาจจะไม่จำเป็นต้องใช้
        */}

        {/* Fallback route สำหรับ non-logged-in users */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;