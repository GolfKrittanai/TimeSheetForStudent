// src/pages/ForgotPasswordPage.js
import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
  Paper,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { forgotPassword } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("รูปแบบอีเมลไม่ถูกต้อง")
        .required("กรุณากรอกอีเมล"),
    }),
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await forgotPassword(values);
        Swal.fire({
          icon: "success",
          title: "ส่งคำขอแล้ว",
          text: res.data.message,
          confirmButtonColor: "#0b7a6b",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: error.response?.data?.message || "ไม่สามารถดำเนินการได้",
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
        bgcolor: "#eef3f5",
        fontFamily: `"Kanit", sans-serif`,
      }}
    >
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
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
          {/* back icon */}
          <IconButton
            onClick={() => navigate("/login")}
            sx={{ position: "absolute", top: 14, left: 14, color: "#0b7a6b" }}
            aria-label="back"
          >
            <ArrowBack />
          </IconButton>

          {/* Headings (match Login style) */}
          <Typography sx={{ color: "#4f5b62", mb: 0.5, fontWeight: 600 }}>
            ลืมรหัสผ่าน ?
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
            รีเซ็ตรหัสผ่านด้วยอีเมลที่ใช้งาน
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ textAlign: "left" }}>
            <Typography sx={{ color: "#455a64" }}>อีเมล</Typography>
            <TextField
              name="email"
              placeholder="กรอกอีเมลของคุณ"
              fullWidth
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.submitCount > 0 && Boolean(formik.errors.email)}
              helperText={formik.submitCount > 0 && formik.errors.email ? formik.errors.email : " "}
              InputProps={{ sx: textFieldSx }}
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
                  "&:hover": { backgroundColor: "#095f52", boxShadow: "0 8px 18px rgba(11,122,107,.28)" },
                }}
              >
                ส่ง
              </Button>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ForgotPasswordPage;
