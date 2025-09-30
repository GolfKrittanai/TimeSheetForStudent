// src/pages/LoginPage.js
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [showPassword, setShowPassword] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  const formik = useFormik({
    initialValues: { studentId: "", password: "" },
    validateOnBlur: false,
    validateOnChange: false,
    validationSchema: Yup.object({
      studentId: Yup.string().required("กรุณากรอกรหัสประจำตัว"),
      password: Yup.string().required("กรุณากรอกรหัสผ่าน"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await loginUser(values);
        login({ token: res.data.token, user: res.data.user });

        if (res.data.user.role === "admin") navigate("/admin");
        else if (res.data.user.role === "student") navigate("/student");
        else navigate("/");
      } catch (error) {
        if (error?.response?.status === 401) {
          Swal.fire({
            icon: "error",
            title: "คุณกรอกข้อมูลไม่ถูกต้อง!!",
            text: "กรุณาตรวจสอบรหัสนักศึกษาและรหัสผ่านอีกครั้ง",
            confirmButtonColor: "#0b7a6b",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
            confirmButtonColor: "#0b7a6b",
          });
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const showErrors = formik.submitCount > 0;

  const textFieldSx = {
    borderRadius: 2,
    backgroundColor: "#ffffff",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cfd8dc" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0b7a6b" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#0b7a6b",
      //boxShadow: "0 0 0 3px rgba(11,122,107,.15)",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2.5,
        bgcolor: "linear-gradient(135deg,#f2f6f7 0%,#e6eef0 100%)",
        fontFamily: `"Kanit", sans-serif`,
      }}
    >
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Paper
          elevation={0}
          sx={{
            width: isSm ? "92vw" : 470,
            borderRadius: 16,
            p: { xs: 3, sm: 5 },
            border: "1px solid #cfd8dc",
            boxShadow: "0 6px 22px rgba(0,0,0,.06)",
            textAlign: "center",
          }}
        >
          {/* Headings */}
          <Typography sx={{ color: "#4f5b62", mb: 0.5, fontWeight: 600 }}>
            เข้าสู่ระบบ
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 38, sm: 44 },
              letterSpacing: 4,
              fontWeight: 800,
              color: "#0b7a6b",
              lineHeight: 1.15,
            }}
          >
            TIMESHEET
          </Typography>
          <Typography sx={{ color: "#4f5b62", mt: 0.5, mb: 2 }}>
            ของนักศึกษา BIS
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ textAlign: "left" }}>
            {/* ===== Label เหนือช่อง: รหัสประจำตัว ===== */}
            <Typography sx={{ color: "#455a64" }}>รหัสประจำตัว</Typography>
            <TextField
              name="studentId"
              placeholder="รหัสประจำตัว"
              fullWidth
              value={formik.values.studentId}
              onChange={formik.handleChange}
              error={showErrors && Boolean(formik.errors.studentId)}
              helperText={showErrors && formik.errors.studentId ? formik.errors.studentId : " "}
              InputProps={{ sx: textFieldSx }}
              margin="dense"
            />

            {/* ===== Label เหนือช่อง: รหัสผ่าน ===== */}
            <Typography sx={{ color: "#455a64" }}>รหัสผ่าน</Typography>
            <TextField
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              fullWidth
              value={formik.values.password}
              onChange={formik.handleChange}
              onFocus={() => setPwdFocused(true)}
              onBlur={() => setPwdFocused(false)}
              error={showErrors && Boolean(formik.errors.password)}
              helperText={showErrors && formik.errors.password ? formik.errors.password : " "}
              InputProps={{
                endAdornment: (formik.values.password || pwdFocused) && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label="toggle password visibility"
                      sx={{ color: "#0b7a6b" }}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: textFieldSx,
              }}
              margin="dense"
            />

            {/* Forgot password link */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -0.5 }}>
              <Button
                type="button"
                onClick={() => navigate("/forgot-password")}
                sx={{
                  textTransform: "none",
                  color: "#0b7a6b",
                  fontWeight: 600,
                  p: 0,
                  minWidth: 0,
                  "&:hover": { textDecoration: "underline", backgroundColor: "transparent" },
                }}
              >
                ลืมรหัสผ่าน ?
              </Button>
            </Box>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={formik.isSubmitting}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: isSm ? "1rem" : "1.05rem",
                  backgroundColor: "#0b7a6b",
                  boxShadow: "0 6px 14px rgba(11,122,107,.25)",
                  "&:hover": { backgroundColor: "#095f52", boxShadow: "0 8px 18px rgba(11,122,107,.28)" },
                }}
              >
                เข้าสู่ระบบ
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                fullWidth
                onClick={() => navigate("/register")}
                sx={{
                  mt: 1.5,
                  py: 1.2,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#0b7a6b",
                  bgcolor: "#e7efee",
                  "&:hover": { bgcolor: "#dbe7e5" },
                }}
              >
                ลงทะเบียน
              </Button>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}
