import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  useTheme,
  useMediaQuery,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../services/userService";

function ProfilePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API || "";
  const API_STATIC_BASE = API_BASE.replace(/\/api$/, "");

  // สเตทสำหรับจัดการไฟล์รูปที่เลือก
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    // ทำงานตอน component จะ unmount หรือ previewImage เปลี่ยนแปลง
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile(token);
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    try {
      await updateUserProfile(profile, token);
      Swal.fire({
        title: "สำเร็จ!",
        text: "ข้อมูลโปรไฟล์ถูกอัปเดตแล้ว",
        icon: "success",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#00796b",
      });
    } catch (error) {
      console.error("Failed to update profile", error);
      Swal.fire({
        title: "ผิดพลาด!",
        text: "ไม่สามารถอัปเดตข้อมูลได้",
        icon: "error",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      Swal.fire({
        title: "ผิดพลาด!",
        text: "รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน",
        icon: "error",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#00796b",
      });
      return;
    }
    setLoadingPwd(true);
    try {
      await changePassword(currentPassword, newPassword, token);
      Swal.fire({
        title: "สำเร็จ!",
        text: "เปลี่ยนรหัสผ่านเรียบร้อย",
        icon: "success",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#00796b",
      });
      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Failed to change password", error);
      Swal.fire({
        title: "ผิดพลาด!",
        text: error.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        icon: "error",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#00796b",
      });
    } finally {
      setLoadingPwd(false);
    }
  };

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7f9" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {profile && (
          <>
            <Paper
              elevation={3}
              sx={{ p: 4, maxWidth: 800, width: "100%", borderRadius: 4 }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Avatar
                  alt={profile.fullName}
                  src={
                    previewImage ||
                    (profile.profileImage
                      ? `${API_STATIC_BASE}${profile.profileImage}`
                      : null)
                  }
                  sx={{
                    width: isSmallScreen ? 100 : 120,
                    height: isSmallScreen ? 100 : 120,
                    mb: 2,
                    border: "3px solid #00796b",
                  }}
                />
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {profile.fullName}
                </Typography>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  gutterBottom
                >
                  {profile.studentId}
                </Typography>
              </Box>

              <form onSubmit={handleUpdateSubmit}>
                <Grid container spacing={isSmallScreen ? 2 : 3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ชื่อ-นามสกุล"
                      name="fullName"
                      value={profile.fullName || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="เบอร์โทร"
                      name="phone"
                      value={profile.phone || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="อีเมล"
                      name="email"
                      value={profile.email || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>

                  {/* ✅ ฟิลด์ข้อมูลเพิ่มเติมสำหรับนักศึกษา */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="หลักสูตร"
                      name="course"
                      value={profile.course || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ภาคการศึกษา"
                      name="semester"
                      value={profile.semester || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ปีการศึกษา"
                      name="academicYear"
                      value={profile.academicYear || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ชื่อสถานประกอบการ"
                      name="companyName"
                      value={profile.companyName || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="ตำแหน่งฝึกงาน"
                      name="internPosition" // ✅ ตรงกับชื่อใน schema.prisma
                      value={profile.internPosition || ""}
                      onChange={handleUpdateChange}
                      fullWidth
                      variant="outlined"
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  type="submit"
                  disabled={loadingUpdate}
                  sx={{
                    mt: 3,
                    backgroundColor: "#00796b",
                    "&:hover": { backgroundColor: "#024f46" },
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.5,
                    fontSize: isSmallScreen ? "0.9rem" : "1rem",
                  }}
                >
                  {loadingUpdate ? "กำลังบันทึก..." : "บันทึกข้อมูลโปรไฟล์"}
                </Button>
              </form>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                p: 4,
                maxWidth: 800,
                width: "100%",
                mt: 4,
                borderRadius: 4,
              }}
            >
              <Typography variant="h6" gutterBottom>
                เปลี่ยนรหัสผ่าน
              </Typography>
              <form onSubmit={handleChangePasswordSubmit}>
                <TextField
                  label="รหัสผ่านปัจจุบัน"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  label="รหัสผ่านใหม่"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  label="ยืนยันรหัสผ่านใหม่"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loadingPwd}
                  sx={{
                    mt: 3,
                    backgroundColor: "#00796b",
                    "&:hover": { backgroundColor: "#024f46" },
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.5,
                    fontSize: isSmallScreen ? "0.9rem" : "1rem",
                  }}
                >
                  {loadingPwd ? "กำลังเปลี่ยนรหัส..." : "เปลี่ยนรหัสผ่าน"}
                </Button>
              </form>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}

export default ProfilePage;