import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { resetPassword } from "../services/authService"; // Import ฟังก์ชันที่เพิ่มใหม่
import { useNavigate, useSearchParams } from "react-router-dom"; // ใช้ useSearchParams
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  useEffect(() => {
    // หากไม่มี token ใน URL ให้เด้งกลับไปหน้า login
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Token ไม่ถูกต้อง!",
        text: "ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#00796b",
      }).then(() => {
        navigate("/login");
      });
    }
  }, [token, navigate]);

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
        .required("กรุณากรอกรหัสผ่านใหม่"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "รหัสผ่านไม่ตรงกัน")
        .required("กรุณายืนยันรหัสผ่าน"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await resetPassword({
          token,
          password: values.password,
        });

        Swal.fire({
          icon: "success",
          title: "รีเซ็ตรหัสผ่านสำเร็จ!",
          text: "คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้แล้ว",
          confirmButtonColor: "#00796b",
        }).then(() => {
          navigate("/login");
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: error.response?.data?.message || "Token ไม่ถูกต้องหรือหมดอายุแล้ว",
          confirmButtonColor: "#00796b",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!token) {
    return null; // ไม่แสดงหน้าเพจหากไม่มี token
  }

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #f0f0f5 0%, #d9e2ec 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        fontFamily: '"Kanit", sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            maxWidth: isSmallScreen ? "90vw" : 400,
            width: "100%",
            bgcolor: "#ffffff",
            p: isSmallScreen ? 3 : 5,
            borderRadius: 3,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <Typography
            variant={isSmallScreen ? "h5" : "h3"}
            sx={{
              fontWeight: 700,
              color: "#00796b",
              mb: 1.5,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            Timesheet
          </Typography>
          <Typography
            variant={isSmallScreen ? "h6" : "h5"}
            sx={{
              fontWeight: 700,
              color: "#000000ff",
              mb: 1.5,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            ตั้งรหัสผ่านใหม่
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#666",
              mb: 2,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            โปรดตั้งรหัสผ่านใหม่
          </Typography>

          <form onSubmit={formik.handleSubmit} noValidate>
            <TextField
              label="รหัสผ่านใหม่"
              name="password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              autoFocus
              // ✅ เพิ่ม onFocus และ onBlur
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              InputProps={{
                // ✅ เพิ่มเงื่อนไขการแสดงผล
                endAdornment: (formik.values.password || passwordFocused) && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
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
                    color: "#00796b",
                  },
                },
              }}
            />
            <TextField
              label="ยืนยันรหัสผ่านใหม่"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={
                formik.touched.confirmPassword &&
                Boolean(formik.errors.confirmPassword)
              }
              helperText={
                formik.touched.confirmPassword && formik.errors.confirmPassword
              }
              // ✅ เพิ่ม onFocus และ onBlur
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
              InputProps={{
                // ✅ เพิ่มเงื่อนไขการแสดงผล
                endAdornment: (formik.values.confirmPassword || confirmPasswordFocused) && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
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
                    color: "#00796b",
                  },
                },
              }}
            />

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontWeight: 700,
                  backgroundColor: "#00796b",
                  borderRadius: 3,
                  "&:hover": { backgroundColor: "#024f46" },
                  textTransform: "none",
                  fontFamily: '"Kanit", sans-serif',
                }}
                disabled={formik.isSubmitting}
              >
                ยืนยัน
              </Button>
            </motion.div>
          </form>
        </Box>
      </motion.div>
    </Box>
  );
};

export default ResetPasswordPage;