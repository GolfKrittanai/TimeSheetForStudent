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
  const API_BASE = process.env.REACT_APP_API || "";
  const API_STATIC_BASE = API_BASE.replace(/\/api$/, ""); 

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // สเตทสำหรับจัดการไฟล์รูปที่เลือก
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    // ทำงานตอน component จะ unmount หรือ previewImage เปลี่ยนแปลง
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage); // คืนหน่วยความจำให้ browser
      }
    };
  }, [previewImage]);

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
        console.log("Profile from API:", res.data); 
        setProfile(res.data);
        setEditData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });
      } catch (error) {
        Swal.fire({
          title: "ผิดพลาด",
          text: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
          icon: "error",
          confirmButtonColor: "#00796b",
        });
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // สร้าง URL preview
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      Swal.fire("ผิดพลาด", "กรุณาเลือกไฟล์รูปก่อน", "error");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", selectedFile);

    setUploading(true);
    try {
      const API_BASE = process.env.REACT_APP_API || "";
      const res = await fetch(`${API_BASE}/api/profile/upload-avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await res.text();
      console.log("Upload response:", text);

      if (!res.ok) {
        let errorMessage = "อัปโหลดไม่สำเร็จ";
        try {
          const data = JSON.parse(text);
          errorMessage = data.message || errorMessage;
        } catch { }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(text);

      Swal.fire("สำเร็จ", "อัปโหลดรูปโปรไฟล์สำเร็จ", "success");
      setProfile((prev) => ({ ...prev, profileImage: data.profileImage }));
      setSelectedFile(null);
    } catch (error) {
      Swal.fire("ผิดพลาด", error.message || "เกิดข้อผิดพลาดในการอัปโหลดรูป", "error");
    }
    setUploading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;

    setLoadingEdit(true);

    try {

      await updateUserProfile(editData, token);
      await Swal.fire({
        title: "สำเร็จ",
        text: "อัปเดตข้อมูลเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
      navigate("/student"); // เปลี่ยนเป็น '/admin' ถ้า admin
    } catch (error) {
      Swal.fire({
        title: "ผิดพลาด",
        text: "ไม่สามารถอัปเดตข้อมูลได้",
        icon: "error",
        confirmButtonColor: "#00796b",
      });

      let profileImageUrl = profile?.profileImage || null;

      // 1. อัปโหลดรูป ถ้ามีไฟล์ที่เลือก
      if (selectedFile) {
        const formData = new FormData();
        formData.append("profileImage", selectedFile);

        const uploadRes = await fetch(`${process.env.REACT_APP_API}/profile/upload-avatar`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.message || "อัปโหลดรูปไม่สำเร็จ");
        }

        const uploadData = await uploadRes.json();
        profileImageUrl = uploadData.profileImage;
      }

      // 2. อัปเดตข้อมูลโปรไฟล์พร้อม URL รูป (ถ้ามี)
      const updateData = {
        ...editData,
        profileImage: profileImageUrl,
      };

      // ใช้ฟังก์ชัน updateUserProfile ของคุณ ที่ส่ง JSON ปกติ
      await updateUserProfile(updateData, token);

      await Swal.fire("สำเร็จ", "อัปเดตข้อมูลเรียบร้อยแล้ว", "success");

      // รีเฟรชข้อมูล หรือไปหน้าอื่นตามต้องการ
      navigate("/student");
    } catch (error) {
      Swal.fire("ผิดพลาด", error.message || "ไม่สามารถอัปเดตข้อมูลได้", "error");

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
      await Swal.fire({
        title: "สำเร็จ",
        text: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      navigate("/student"); // หรือ '/admin'
    } catch (error) {
      Swal.fire({
        title: "ผิดพลาด",
        text: error.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        icon: "error",
        confirmButtonColor: "#00796b",
      });
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
          <label htmlFor="avatar-upload" style={{ cursor: "pointer" }}>
            <Avatar
              src={
                previewImage ||
                (profile?.profileImage
                  ? (profile.profileImage.startsWith("http")
                    ? profile.profileImage
                    : `${API_STATIC_BASE}${profile.profileImage}`)
                  : "")
              }
              alt={profile?.fullName || user?.fullName}
              sx={{
                width: isSmallScreen ? 72 : 96,
                height: isSmallScreen ? 72 : 96,
                bgcolor: "#00796b",
                fontSize: isSmallScreen ? 32 : 40,
                transition: "box-shadow 0.3s ease",
                "&:hover": {
                  boxShadow: "0 0 10px 3px #00796b",
                },
              }}
            >
              {(profile?.fullName || user?.fullName)?.[0].toUpperCase()}
            </Avatar>
          </label>
          <input
            accept="image/*"
            id="avatar-upload"
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
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
