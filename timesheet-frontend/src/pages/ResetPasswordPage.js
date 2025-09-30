// src/pages/ResetPasswordPage.js
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
  Paper,
  InputAdornment,
} from "@mui/material";
import { ArrowBack, Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

// TODO: แก้ import ให้ตรงกับโปรเจกต์ของคุณ
import { resetPassword } from "../services/authService";

const ResetPasswordPage = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
        .required("กรุณากรอกรหัสผ่านใหม่"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "รหัสผ่านไม่ตรงกัน")
        .required("กรุณายืนยันรหัสผ่าน"),
    }),
    // ให้ขึ้น error เฉพาะตอนกด submit
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await resetPassword({
          token,
          password: values.password,
        });
        await Swal.fire({
          icon: "success",
          title: "ตั้งรหัสผ่านใหม่สำเร็จ",
          text: "กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณ",
          confirmButtonColor: "#0b7a6b",
        });
        navigate("/login");
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถตั้งรหัสผ่านได้",
          text:
            err?.response?.data?.message ||
            "กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
          confirmButtonColor: "#0b7a6b",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const textFieldSx = {
    borderRadius: 2,
    backgroundColor: "#f9fbfb",
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
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Paper
          elevation={0}
          sx={{
            width: isSmall ? "92vw" : 470,
            borderRadius: 16,
            p: { xs: 3, sm: 5 },
            border: "1px solid #cfd8dc",
            boxShadow: "0 6px 22px rgba(0,0,0,.06)",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* ปุ่มย้อนกลับ */}
          <IconButton
            onClick={() => navigate("/login")}
            sx={{ position: "absolute", top: 14, left: 14, color: "#0b7a6b" }}
            aria-label="back"
          >
            <ArrowBack />
          </IconButton>

          {/* หัวข้อให้เหมือนหน้า Login */}
          <Typography sx={{ color: "#4f5b62", mb: 0.5, fontWeight: 600 }}>
            ตั้งรหัสผ่านใหม่
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
            กรอกรหัสผ่านใหม่และยืนยันรหัสผ่าน
          </Typography>

          {/* ฟอร์ม */}
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            noValidate
            sx={{ textAlign: "left" }}
          >
            <Typography sx={{ color: "#455a64" }}>รหัสผ่านใหม่</Typography>
            <TextField
              name="password"
              type={showPwd ? "text" : "password"}
              placeholder="กรอกรหัสผ่านใหม่"
              fullWidth
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.submitCount > 0 && Boolean(formik.errors.password)}
              helperText={
                formik.submitCount > 0 && formik.errors.password
                  ? formik.errors.password
                  : " "
              }
              InputProps={{
                sx: textFieldSx,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPwd((v) => !v)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="dense"
            />

            <Typography sx={{ color: "#455a64", mt: 1 }}>
              ยืนยันรหัสผ่านใหม่
            </Typography>
            <TextField
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="ยืนยันรหัสผ่านใหม่"
              fullWidth
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={
                formik.submitCount > 0 &&
                Boolean(formik.errors.confirmPassword)
              }
              helperText={
                formik.submitCount > 0 && formik.errors.confirmPassword
                  ? formik.errors.confirmPassword
                  : " "
              }
              InputProps={{
                sx: textFieldSx,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((v) => !v)}
                      edge="end"
                      aria-label="toggle confirm password visibility"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="dense"
            />

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
                  fontSize: isSmall ? "1rem" : "1.05rem",
                  backgroundColor: "#0b7a6b",
                  boxShadow: "0 6px 14px rgba(11,122,107,.25)",
                  "&:hover": {
                    backgroundColor: "#095f52",
                    boxShadow: "0 8px 18px rgba(11,122,107,.28)",
                  },
                }}
              >
                ยืนยัน
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                type="button"
                onClick={() => navigate("/login")}
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
                กลับหน้าเข้าสู่ระบบ
              </Button>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ResetPasswordPage;
