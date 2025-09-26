// ในไฟล์ timesheet-frontend/src/pages/ForgotPasswordPage.js

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
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
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("รูปแบบอีเมลไม่ถูกต้อง")
        .required("กรุณากรอกอีเมล"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await forgotPassword(values);
        Swal.fire({
          icon: "success",
          title: "คำขอส่งแล้ว!",
          text: res.data.message,
          confirmButtonColor: "#00796b",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text:
            error.response?.data?.message || "ไม่สามารถดำเนินการได้ในขณะนี้",
          confirmButtonColor: "#00796b",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

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
            maxWidth: isSmallScreen ? "90vw" : 500,
            width: "100%",
            bgcolor: "#ffffff",
            p: isSmallScreen ? 3 : 9,
            borderRadius: 3,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => navigate("/login")}
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              color: "#00796b",
            }}
          >
            <ArrowBack/>
          </IconButton>
          <Typography
            variant={isSmallScreen ? "h6" : "h5"}
            sx={{
              fontWeight: 700,
              color: "#00796b",
              mb: 1,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            ลืมรหัสผ่าน ?
          </Typography>
          <Typography
            variant={isSmallScreen ? "h5" : "h3"}
            sx={{
              fontWeight: 700,
              color: "#00796b",
              mb: 1,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
           Timesheet
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#666",
              mb: 2,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            รีเซ็ตรหัสผ่านด้วยอีเมลที่ใช้งาน
          </Typography>

          <form onSubmit={formik.handleSubmit} noValidate>
            <TextField
              label="อีเมล"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              autoFocus
              InputProps={{
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
                ส่ง
              </Button>
            </motion.div>
          </form>
        </Box>
      </motion.div>
    </Box>
  );
};

export default ForgotPasswordPage;
