import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentTimesheetView from "./pages/StudentTimesheetView";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./context/AuthContext";
import ReportExport from "./pages/ReportExport";
import { CssBaseline } from "@mui/material";

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

        <Route
          path="/admin"
          element={
            user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" />
          }
        />
        <Route
          path="/student"
          element={
            user?.role === "student" ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/student/:id/timesheets"
          element={
            user?.role === "admin" ? (
              <StudentTimesheetView />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/" />}
        />
        <Route
          path="/report"
          element={user ? <ReportExport user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/student/export"
          element={user ? <ReportExport user={user} /> : <Navigate to="/" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
