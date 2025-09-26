import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./context/AuthContext";
import ReportExport from "./pages/ReportExport";
import { CssBaseline } from "@mui/material";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TimesheetHistoryPage from "./pages/TimesheetHistoryPage"; // ✅ Import new component

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
            ) : (
              <Navigate to="/student" />
            )
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        {user?.role === "admin" && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/report"
              element={<ReportExport user={user} />}
            />
            <Route path="*" element={<Navigate to="/admin" />} />
          </>
        )}

        {/* Student routes */}
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

        {/* Fallback route for logged-in users to redirect to their dashboard */}
        {user && user.role === "admin" && <Route path="*" element={<Navigate to="/admin" />} />}
        {user && user.role === "student" && <Route path="*" element={<Navigate to="/student" />} />}

        {/* Fallback route for non-logged-in users */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;