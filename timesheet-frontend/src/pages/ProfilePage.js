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
  IconButton,
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  getUserProfile,
  updateUserProfile,
} from "../services/userService";

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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const API_BASE = process.env.REACT_APP_API || "";
  const API_STATIC_BASE = API_BASE.replace(/\/api$/, "");

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

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(profile, token);
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
          {/* Segmented header */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 2,
              display: "flex",
              gap: 1,
              borderRadius: 3,
              bgcolor: "#ffffff",
              border: "1px solid #e0e0e0",
            }}
          >
            <Button
              fullWidth
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#0b7a6b",
                "&:hover": { bgcolor: "#095f52" },
                borderRadius: 2,
              }}
              onClick={() => { }}
            >
              แก้ไขข้อมูลส่วนตัว
            </Button>
            <Button
              fullWidth
              variant="text"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "transparent",
                borderRadius: 2,
                color: "#0b7a6b",
                border: "1px solid #cfd8dc",
                "&:hover": { bgcolor: "#f4fbfa" },
              }}
              onClick={() => navigate("/reset-password")}
            >
              เปลี่ยนรหัสผ่าน
            </Button>
          </Paper>

          {/* Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              p: { xs: 2, md: 4 },
              bgcolor: "#fff",
              border: "1px solid #e0e0e0",
            }}
          >
            {/* Avatar + title */}
            <Box sx={{ textAlign: "center", mb: { xs: 2, md: 3 } }}>
              <Avatar
                alt={profile.fullName || "student"}
                src={profile.profileImage ? `${API_STATIC_BASE}${profile.profileImage}` : undefined}
                sx={{
                  width: isSmall ? 108 : 128,
                  height: isSmall ? 108 : 128,
                  mx: "auto",
                  mb: 1.5,
                  border: "3px solid #0b7a6b",
                }}
              />
              <Typography variant="h6" sx={{ color: "#0b7a6b", fontWeight: 800 }}>
                แก้ไขข้อมูลส่วนตัว
              </Typography>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={onSubmit}>
              <Grid container spacing={2.4}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="สิทธิการเข้าใช้งาน"
                    value="นักศึกษา"
                    disabled
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} />

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="รหัสประจำตัว"
                    name="studentId"
                    value={profile.studentId || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ชื่อ-นามสกุล"
                    name="fullName"
                    value={profile.fullName || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="หลักสูตร(ปี)"
                    name="course"
                    value={profile.course || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="อีเมล"
                    name="email"
                    value={profile.email || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="เบอร์โทรศัพท์"
                    name="phone"
                    value={profile.phone || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ชื่อสถานประกอบการ"
                    name="companyName"
                    value={profile.companyName || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ตำแหน่งฝึกงาน"
                    name="internPosition"
                    value={profile.internPosition || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ภาคการศึกษา"
                    name="semester"
                    value={profile.semester || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ปีการศึกษา"
                    name="academicYear"
                    value={profile.academicYear || ""}
                    onChange={onChange}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "#0b7a6b",
                    color: "#0b7a6b",
                    "&:hover": { borderColor: "#095f52", bgcolor: "#f4fbfa" },
                    fontWeight: 700,
                  }}
                >
                  ย้อนกลับ
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    bgcolor: "#0b7a6b",
                    "&:hover": { bgcolor: "#095f52" },
                    fontWeight: 700,
                  }}
                >
                  แก้ไข
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
