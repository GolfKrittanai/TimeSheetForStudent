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
} from "@mui/material";
import Navbar from "../components/Navbar";
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
  const navigate = useNavigate();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ฟอร์มแก้ไขข้อมูลส่วนตัว
  const [editData, setEditData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  // ฟอร์มเปลี่ยนรหัสผ่าน
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loadingPwd, setLoadingPwd] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getUserProfile(token);
        setProfile(res.data);
        setEditData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });
      } catch (error) {
        Swal.fire("ผิดพลาด", "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", "error");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [token]);

  const validateEdit = () => {
    const errors = {};
    if (!editData.fullName.trim()) errors.fullName = "กรุณากรอกชื่อ-นามสกุล";
    if (editData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email))
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (editData.phone && !/^[0-9()+-\s]{5,20}$/.test(editData.phone))
      errors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword)
      errors.currentPassword = "กรุณากรอกรหัสผ่านปัจจุบัน";
    if (!passwordData.newPassword) errors.newPassword = "กรุณากรอกรหัสผ่านใหม่";
    else if (passwordData.newPassword.length < 6)
      errors.newPassword = "รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัวอักษร";
    if (passwordData.newPassword !== passwordData.confirmNewPassword)
      errors.confirmNewPassword = "รหัสผ่านไม่ตรงกัน";
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;
    setLoadingEdit(true);
    try {
      await updateUserProfile(editData, token);
      await Swal.fire("สำเร็จ", "อัปเดตข้อมูลเรียบร้อยแล้ว", "success");
      navigate("/student"); // เปลี่ยนเป็น '/admin' ถ้า admin
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
    }
    setLoadingEdit(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoadingPwd(true);
    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        token
      );
      await Swal.fire("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      navigate("/student"); // หรือ '/admin'
    } catch (error) {
      Swal.fire(
        "ผิดพลาด",
        error.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        "error"
      );
    }
    setLoadingPwd(false);
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "90vh",
          maxWidth: 700,
          mx: "auto",
          px: isSmallScreen ? 2 : 4,
          py: isSmallScreen ? 4 : 6,
          backgroundColor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
          gap: isSmallScreen ? 3 : 4,
        }}
      >
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{
            fontWeight: 700,
            color: "#00796b",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Avatar
            src={profile?.avatarUrl || ""}
            alt={profile?.fullName || user?.fullName}
            sx={{
              width: isSmallScreen ? 72 : 96,
              height: isSmallScreen ? 72 : 96,
              bgcolor: "#00796b",
              fontSize: isSmallScreen ? 32 : 40,
            }}
          >
            {(profile?.fullName || user?.fullName)?.[0].toUpperCase()}
          </Avatar>
          โปรไฟล์ของ {profile?.fullName || user?.fullName}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper
              sx={{
                p: isSmallScreen ? 3 : 4,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
              elevation={4}
            >
              <Typography variant="h6" sx={{ mb: 2, color: "#00796b" }}>
                แก้ไขข้อมูลส่วนตัว
              </Typography>
              <Box component="form" onSubmit={handleEditSubmit} noValidate>
                <TextField
                  fullWidth
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleEditChange}
                  error={Boolean(editErrors.fullName)}
                  helperText={editErrors.fullName}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  label="อีเมล"
                  name="email"
                  type="email"
                  value={editData.email}
                  onChange={handleEditChange}
                  error={Boolean(editErrors.email)}
                  helperText={editErrors.email}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  error={Boolean(editErrors.phone)}
                  helperText={editErrors.phone}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  label="ที่อยู่"
                  name="address"
                  multiline
                  rows={isSmallScreen ? 2 : 3}
                  value={editData.address}
                  onChange={handleEditChange}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />

                <Button
                  variant="contained"
                  type="submit"
                  disabled={loadingEdit}
                  sx={{
                    backgroundColor: "#00796b",
                    "&:hover": { backgroundColor: "#024f46" },
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.5,
                    fontSize: isSmallScreen ? "0.9rem" : "1rem",
                  }}
                >
                  {loadingEdit ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </Box>
            </Paper>

            <Paper
              sx={{
                p: isSmallScreen ? 3 : 4,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
              elevation={4}
            >
              <Typography variant="h6" sx={{ mb: 2, color: "#00796b" }}>
                เปลี่ยนรหัสผ่าน
              </Typography>
              <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                <TextField
                  fullWidth
                  label="รหัสผ่านปัจจุบัน"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={Boolean(passwordErrors.currentPassword)}
                  helperText={passwordErrors.currentPassword}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  label="รหัสผ่านใหม่"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={Boolean(passwordErrors.newPassword)}
                  helperText={passwordErrors.newPassword}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  label="ยืนยันรหัสผ่านใหม่"
                  name="confirmNewPassword"
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  error={Boolean(passwordErrors.confirmNewPassword)}
                  helperText={passwordErrors.confirmNewPassword}
                  InputProps={{
                    sx: {
                      mb: 3,
                      fontFamily: '"Didonesque", sans-serif',
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ccc",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#00796b",
                        boxShadow: "0 0 5px 0 #00796b",
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "",
                      "&.Mui-focused": {
                        color: "#00796b", // สีเขียวเมื่อกรอบได้รับการโฟกัส
                      },
                    },
                  }}
                  size={isSmallScreen ? "small" : "medium"}
                />

                <Button
                  variant="contained"
                  type="submit"
                  disabled={loadingPwd}
                  sx={{
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
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </>
  );
}

export default ProfilePage;
