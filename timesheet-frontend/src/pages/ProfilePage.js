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
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
} from "../services/userService";
import ResetPasswordTab from "../components/ResetPasswordTab";

/* ---------- สไตล์ TextField: ใช้เหมือนหน้า Register ---------- */
const textFieldSx = {
  borderRadius: 2,
  backgroundColor: "#ffffff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cfd8dc" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0b7a6b" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0b7a6b",
    // boxShadow: "0 0 0 3px rgba(11,122,107,.15)", // เปิดได้ถ้าต้องการเงา focus
  },
  /* ตอน disabled ให้ดูซอฟต์เหมือน read-only */
  "&.Mui-disabled": {
    backgroundColor: "#f9fbfb",
  },
  "& .MuiOutlinedInput-input.Mui-disabled": {
    WebkitTextFillColor: "#546e7a",
  },
};

/* ---------- หัวข้อ label อยู่ “เหนือช่อง” เหมือนหน้า Register ---------- */
const FieldLabel = ({ children, required }) => (
  <Typography
    sx={{
      fontSize: 13,
      lineHeight: 1.2,
      color: "#455a64",
      mb: 0.5,
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      fontWeight: 500,
    }}
  >
    {children}
    {required && <Box component="span" sx={{ color: "#e53935", fontSize: 14 }}>*</Box>}
  </Typography>
);

export default function ProfilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    course: "",
    semester: "",
    academicYear: "",
    companyName: "",
    internPosition: "",
    profileImage: "",
    role: "student",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = React.useRef(null);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const API_BASE = process.env.REACT_APP_API || "";

  // โหมดแก้ไข + เก็บสแนปช็อตสำหรับ "ยกเลิก"
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);

  // แท็บ: 'profile' | 'password'
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const data = await getUserProfile(token);
        const p =
          data?.profile ??
          data?.data ??
          (Array.isArray(data) ? data[0] : data) ??
          {};
        setProfile((prev) => ({ ...prev, ...p }));
        setOriginalProfile(p);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setProfile((prev) => ({ ...prev }));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // เลือกรูป -> ทำพรีวิว
  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "warning", title: "ไฟล์ไม่ใช่รูปภาพ" });
      return;
    }
    setNewImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  };

  const triggerPickImage = () => fileInputRef.current?.click();

  const clearPickedImage = () => {
    setNewImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };


  const startEdit = () => {
    setOriginalProfile(profile);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (originalProfile) setProfile(originalProfile);
    setIsEditing(false);
    clearPickedImage();
  };

  const roleLabel = {
    student: "นักศึกษา",
    teacher: "อาจารย์",
    admin: "ผู้ดูแลระบบ",
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    setSaving(true);
    try {
      // 1) อัปเดตฟิลด์ข้อความ
      await updateUserProfile(
        {
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          companyName: profile.companyName || "",
          internPosition: profile.internPosition || "",
        },
        token
      );

      // 2) ถ้ามีเลือกรูปใหม่ → อัปโหลดไป Supabase ผ่าน BE
      if (newImageFile) {
        const res = await uploadAvatar(newImageFile, token);
        const newUrl = res?.data?.profileImage || res?.data?.user?.profileImage;
        if (newUrl) {
          setProfile((p) => ({ ...p, profileImage: newUrl }));
        }
        clearPickedImage();
      }

      setOriginalProfile(profile);
      setIsEditing(false);
      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "อัปเดตข้อมูลโปรไฟล์แล้ว",
        confirmButtonColor: "#0b7a6b",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "บันทึกล้มเหลว",
        text: "โปรดลองอีกครั้ง",
        confirmButtonColor: "#0b7a6b",
      });
    } finally {
      setSaving(false);
    }
  };

  const goProfileTab = () => setActiveTab("profile");
  const goPasswordTab = () => {
    setIsEditing(false);
    setActiveTab("password");
  };

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#eef3f5" }}>
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 880, mx: "auto" }}>
          {/* Paper เดียว: รวมแท็บ + เนื้อหา */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              p: { xs: 2, md: 4 },
              bgcolor: "#fff",
              border: "1px solid #e0e0e0",
            }}
          >
            {/* Tabs ด้านบน */}
            <Box sx={{ p: 1, mb: 2, display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant={activeTab === "profile" ? "contained" : "text"}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: activeTab === "profile" ? "#0b7a6b" : "transparent",
                  color: activeTab === "profile" ? "#fff" : "#0b7a6b",
                  "&:hover": { bgcolor: activeTab === "profile" ? "#095f52" : "#f4fbfa" },
                  borderRadius: 2,
                  border: activeTab === "profile" ? "none" : "1px solid #cfd8dc",
                }}
                onClick={goProfileTab}
              >
                ข้อมูลส่วนตัว
              </Button>

              <Button
                fullWidth
                variant={activeTab === "password" ? "contained" : "text"}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: activeTab === "password" ? "#0b7a6b" : "transparent",
                  color: activeTab === "password" ? "#fff" : "#0b7a6b",
                  "&:hover": { bgcolor: activeTab === "password" ? "#095f52" : "#f4fbfa" },
                  borderRadius: 2,
                  border: activeTab === "password" ? "none" : "1px solid #cfd8dc",
                }}
                onClick={goPasswordTab}
              >
                เปลี่ยนรหัสผ่าน
              </Button>
            </Box>

            {/* Avatar + Title — แสดงเฉพาะแท็บข้อมูลส่วนตัว */}
            {activeTab === "profile" && (
              <Box sx={{ textAlign: "center", mb: { xs: 2, md: 3 } }}>
                <Avatar
                  alt={profile.fullName || "student"}
                  src={previewUrl ? previewUrl : (profile.profileImage || undefined)}
                  sx={{
                    width: isSmall ? 108 : 128,
                    height: isSmall ? 108 : 128,
                    mx: "auto",
                    mb: 1.5,
                    border: "3px solid #0b7a6b",
                  }}
                />
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPickImage}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={triggerPickImage}
                    disabled={!isEditing}
                    sx={{
                      mt: 0.5,
                      borderColor: "#0b7a6b",
                      color: "#0b7a6b",
                      textTransform: "none",
                      "&:hover": { borderColor: "#095f52", bgcolor: "#f4fbfa" },
                    }}
                  >
                    เปลี่ยนรูปโปรไฟล์
                  </Button>
                  {previewUrl && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={clearPickedImage}
                      sx={{ ml: 1, textTransform: "none", color: "#e53935" }}
                    >
                      ยกเลิกรูปที่เลือก
                    </Button>
                  )}
                </Box>
                <Typography variant="h5" sx={{ color: "#0b7a6b", fontWeight: 500 }}>
                  แก้ไขข้อมูลส่วนตัว
                </Typography>
              </Box>
            )}

            {/* --- PROFILE TAB --- */}
            {activeTab === "profile" && (
              <Box component="form" onSubmit={onSubmit}>
                <Grid container spacing={2.4}>
                  {/* สิทธิการเข้าใช้งาน (ปิดเสมอ) */}
                  <Grid item xs={12}>
                    <FieldLabel>สิทธิการเข้าใช้งาน</FieldLabel>
                    <TextField
                      value={roleLabel[profile.role] ?? "ไม่ระบุ"}
                      disabled
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                      FormHelperTextProps={{ sx: { mt: 0.25, fontSize: 12, lineHeight: 1.2, m: 0 } }}
                    />
                  </Grid>

                  {/* ชื่อ-นามสกุล */}
                  <Grid item xs={12}>
                    <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                    <TextField
                      name="fullName"
                      value={profile.fullName || ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* รหัสประจำตัว (ปิดเสมอ) */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>รหัสประจำตัว</FieldLabel>
                    <TextField
                      name="studentId"
                      value={profile.studentId || ""}
                      onChange={onChange}
                      disabled
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* หลักสูตร(ปี) (ปิดเสมอ) */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>หลักสูตร(ปี)</FieldLabel>
                    <TextField
                      name="course"
                      value={profile.course || ""}
                      onChange={onChange}
                      disabled
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* ภาคการศึกษา (ปิดเสมอ) */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>ภาคการศึกษา</FieldLabel>
                    <TextField
                      name="semester"
                      value={profile.semester || ""}
                      onChange={onChange}
                      disabled
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* ปีการศึกษา (ปิดเสมอ) */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>ปีการศึกษา</FieldLabel>
                    <TextField
                      name="academicYear"
                      value={profile.academicYear || ""}
                      onChange={onChange}
                      disabled
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* อีเมล */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>อีเมล</FieldLabel>
                    <TextField
                      name="email"
                      value={profile.email || ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* เบอร์โทรศัพท์ */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
                    <TextField
                      name="phone"
                      value={profile.phone || ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* ชื่อสถานประกอบการ */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>ชื่อสถานประกอบการ</FieldLabel>
                    <TextField
                      name="companyName"
                      value={profile.companyName || ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>

                  {/* ตำแหน่งฝึกงาน */}
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>ตำแหน่งฝึกงาน</FieldLabel>
                    <TextField
                      name="internPosition"
                      value={profile.internPosition || ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      fullWidth
                      size="medium"
                      margin="none"
                      InputProps={{ sx: textFieldSx }}
                    />
                  </Grid>
                </Grid>

                {/* ปุ่มล่าง: เท่ากัน 2 ฝั่ง กึ่งกลาง */}
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ maxWidth: 560, mx: "auto" }}>
                    {!isEditing ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            sx={{
                              py: 1.2,
                              borderRadius: 2,
                              textTransform: "none",
                              borderColor: "#0b7a6b",
                              color: "#0b7a6b",
                              "&:hover": { borderColor: "#095f52", bgcolor: "#f4fbfa" },
                              fontWeight: 500,
                            }}
                          >
                            ย้อนกลับ
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            type="button"
                            fullWidth
                            onClick={(e) => {
                              e.preventDefault();
                              startEdit();
                            }}
                            variant="contained"
                            sx={{
                              py: 1.2,
                              borderRadius: 2,
                              textTransform: "none",
                              bgcolor: "#0b7a6b",
                              "&:hover": { bgcolor: "#095f52" },
                              fontWeight: 500,
                            }}
                          >
                            แก้ไข
                          </Button>
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            onClick={cancelEdit}
                            sx={{
                              py: 1.2,
                              borderRadius: 2,
                              textTransform: "none",
                              borderColor: "#0b7a6b",
                              color: "#0b7a6b",
                              "&:hover": { borderColor: "#095f52", bgcolor: "#f4fbfa" },
                              fontWeight: 500,
                            }}
                          >
                            ยกเลิก
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={saving}
                            sx={{
                              py: 1.2,
                              borderRadius: 2,
                              textTransform: "none",
                              bgcolor: "#0b7a6b",
                              "&:hover": { bgcolor: "#095f52" },
                              fontWeight: 500,
                            }}
                          >
                            บันทึกข้อมูล
                          </Button>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* --- CHANGE PASSWORD TAB --- */}
            {activeTab === "password" && (
              <ResetPasswordTab token={token} onBack={goProfileTab} />
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
