// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AddAccount from './pages/Admin/AddAccount'; 
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./context/AuthContext";
import ReportExport from "./pages/ReportExport";
import { CssBaseline } from "@mui/material";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TimesheetHistoryPage from "./pages/TimesheetHistoryPage"; 
import StudentTimesheetView from "./pages/StudentTimesheetView"; 

// หน้าระบบสแกนเอกสาร
import DocumentScanDashboard from "./pages/Step1_student/DocumentScanDashboard";
import DocumentScanUpload from "./pages/Step1_student/DocumentScanUpload";
import DocumentScanHistory from "./pages/Step1_student/DocumentScanHistory";
import DocumentReviewAdmin from "./pages/Documentreviewadmin";
import DocumentSummary from "./pages/Step1_student/DocumentSummary";

import DocumentScanDashboard2 from "./pages/Step2_student/DocumentScanDashboard2";
import DocumentScanUpload2 from "./pages/Step2_student/DocumentScanUpload2";
import DocumentSummary2 from "./pages/Step2_student/DocumentSummary2";

import DocumentScanDashboard3 from "./pages/Step3_student/DocumentScanDashboard3";

// หน้าของ Admin
import AdminDocumentManagement from "./pages/Admin/AdminDocumentManagement";
import AdminStudentDocConfig from "./pages/Admin/AdminStudentDocConfig";
import AdminStudentDocForm from "./pages/Admin/AdminStudentDocForm"; // 👈 หน้านี้ที่สร้างใหม่
import AdminStudentDocReviewList from "./pages/Admin/AdminStudentDocReviewList";

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
            ) : user.role === "teacher" ? (
              <Navigate to="/teacher" />
            ) : (
              <Navigate to="/student/scan" />
            )
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ---------------- Admin routes ---------------- */}
        {user?.role === "admin" && (
          <>
            {/* 1. Dashboard (หน้าหลักของแอดมิน) */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/add-account" element={<AddAccount />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportExport user={user} />} />
            
            <Route 
              path="/admin/student/:id/timesheets" 
              element={<StudentTimesheetView />} 
            />
            <Route 
              path="/admin/documents/review" 
              element={<DocumentReviewAdmin />} 
            />

            {/* 2. เมนูย่อยของ Document co-op: จัดการเอกสาร */}
            <Route 
              path="/admin/document-management" 
              element={<AdminDocumentManagement />} 
            />

            {/* 3. เมนูย่อยของ Document co-op: จัดการเอกสารสำหรับนักศึกษา */}
            <Route 
              path="/admin/student-docs" 
              element={<AdminStudentDocConfig />} 
            />

            {/* 🟢 หน้าฟอร์มเพิ่ม/แก้ไขเอกสารสำหรับนักศึกษา (ตามภาพใหม่) */}
            <Route 
              path="/admin/student-docs/new" 
              element={<AdminStudentDocForm />} 
            />
            <Route 
              path="/admin/student-docs/edit" 
              element={<AdminStudentDocForm />} 
            />

            {/* 4. หน้ารายชื่อตรวจสอบเอกสารนักศึกษา */}
            <Route 
              path="/admin/student-doc-reviews" 
              element={<AdminStudentDocReviewList />} 
            />

            <Route path="*" element={<Navigate to="/admin" />} />
          </>
        )}

        {/* ---------------- Teacher routes ---------------- */}
        {user?.role === "teacher" && (
          <>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportExport user={user} />} />
            
            <Route 
              path="/teacher/student/:id/timesheets" 
              element={<StudentTimesheetView />} 
            />
            
            <Route 
              path="/teacher/documents/review" 
              element={<DocumentReviewAdmin />} 
            />

            <Route path="*" element={<Navigate to="/teacher" />} />
          </>
        )}

        {/* ---------------- Student routes ---------------- */}
        {user?.role === "student" && (
          <>
            <Route path="/student/scan" element={<DocumentScanDashboard />} />
            <Route path="/student/scan-upload" element={<DocumentScanUpload />} />
            <Route path="/student/scan-summary" element={<DocumentSummary />} />
            <Route path="/student/scan-history" element={<DocumentScanHistory />} />
            <Route path="/student/step2-dashboard" element={<DocumentScanDashboard2 />} />
            <Route path="/student/step2-upload" element={<DocumentScanUpload2 />} />
            <Route path="/student/step2-summary" element={<DocumentSummary2 />} />
            <Route path="/student/step3-dashboard" element={<DocumentScanDashboard3 />} />
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

        {/* Fallback route สำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;