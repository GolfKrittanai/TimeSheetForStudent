import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  useMediaQuery,
  useTheme,
  MenuItem,
  styled,
  Grid,
} from "@mui/material";
import {
  AccountCircle,
  Badge,
  Lock,
  LockReset,
  ArrowBack,
  Email,
  Phone,
  School as SchoolIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

// ✅ ย้ายคอมโพเนนต์ CustomField และ StyledTextField ออกมาไว้ด้านนอก
const handlePasswordValidate = (value) => {
  const hasMinLength = value.length >= 8;
  const hasMaxLength = value.length <= 16;
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasOnlyAlphanumeric = /^[a-zA-Z0-9]+$/.test(value);

  return {
    hasMinLength,
    hasMaxLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasOnlyAlphanumeric,
  };
};

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    fontFamily: '"Kanit", sans-serif',
    borderRadius: theme.spacing(2),
    backgroundColor: "#fafafa",
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
}));

function CustomField({
  label,
  name,
  icon,
  formik,
  type = "text",
  select = false,
  options = [],
  multiline = false,
  rows = 1,
  setValidatePassword, // เพิ่ม prop สำหรับ set state
}) {
  return (
    <StyledTextField
      label={label}
      name={name}
      type={type}
      fullWidth
      variant="outlined"
      select={select}
      value={formik.values[name]}
      onChange={(e) => {
        formik.handleChange(e);
        if (name === "password") {
          const validation = handlePasswordValidate(e.target.value);
          setValidatePassword(validation);
        }
      }}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      multiline={multiline}
      rows={rows}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">{icon}</InputAdornment>
        ),
      }}
      InputLabelProps={{
        sx: {
          color: "#00796b",
          "&.Mui-focused": {
            color: "#00796b",
          },
        },
      }}
    >
      {select &&
        options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
    </StyledTextField>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const courseOptions = ["2ปี", "4ปี"];
  const semesterOptions = ["1", "2", "3"];

  const [validatePassword, setValidatePassword] = useState({
    hasMinLength: null,
    hasMaxLength: null,
    hasLowercase: null,
    hasUppercase: null,
    hasNumber: null,
    hasOnlyAlphanumeric: null,
  });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      studentId: "",
      course: "",
      semester: "",
      academicYear: "",
      email: "",
      phone: "",
      companyName: "",
      internPosition: "",
      password: "",
      confirmPassword: "",
      role: "student",
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required("กรุณากรอกชื่อ-นามสกุล"),
      studentId: Yup.string().required("กรุณากรอกรหัสประจำตัว"),
      course: Yup.string().required("กรุณาเลือกหลักสูตร"),
      semester: Yup.string().required("กรุณาเลือกภาคการศึกษา"),
      academicYear: Yup.string().required("กรุณากรอกปีการศึกษา"),
      email: Yup.string().email("อีเมลไม่ถูกต้อง").required("กรุณากรอกอีเมล"),
      phone: Yup.string().required("กรุณากรอกเบอร์โทรศัพท์"),
      companyName: Yup.string().required("กรุณากรอกชื่อสถานประกอบการ"),
      internPosition: Yup.string().required("กรุณากรอกตำแหน่งฝึกงาน"),
      password: Yup.string()
        .required("กรุณากรอกรหัสผ่าน")
        .test(
          "password-validation",
          "รหัสผ่านไม่ตรงตามเงื่อนไขที่กำหนด",
          (value) => {
            if (!value) return true;
            const result = handlePasswordValidate(value);
            return (
              result.hasMinLength &&
              result.hasMaxLength &&
              result.hasLowercase &&
              result.hasUppercase &&
              result.hasNumber &&
              result.hasOnlyAlphanumeric
            );
          }
        ),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "รหัสผ่านไม่ตรงกัน")
        .required("กรุณายืนยันรหัสผ่าน"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await registerUser(values);
        Swal.fire({
          title: "ลงทะเบียนสำเร็จ!",
          text: "คุณสามารถเข้าสู่ระบบได้แล้ว",
          icon: "success",
          confirmButtonColor: "#00796b",
        }).then(() => {
          navigate("/");
        });
      } catch (error) {
        Swal.fire({
          title: "ลงทะเบียนไม่สำเร็จ",
          text: error.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน",
          icon: "error",
          confirmButtonColor: "#00796b",
        });
      }
      setSubmitting(false);
    },
  });

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: isSmallScreen ? 2 : 4,
        backgroundImage: "linear-gradient(to bottom right, #e0f2f1, #ffffff)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            width: isSmallScreen ? "100%" : 600,
            p: isSmallScreen ? 3 : 5,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 4,
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant={isSmallScreen ? "h5" : "h4"}
            sx={{
              fontWeight: "700",
              color: "#00796b",
              mb: 2,
              textAlign: "center",
              letterSpacing: 1,
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            ลงทะเบียน
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              {/* ช่อง ชื่อ-นามสกุล */}
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={12}>
                  <CustomField
                    label="ชื่อ-นามสกุล"
                    name="fullName"
                    icon={<AccountCircle sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
              </Grid>
              {/* ช่อง รหัสประจำตัว และ ปีการศึกษา */}
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="รหัสประจำตัว"
                    name="studentId"
                    icon={<Badge sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="หลักสูตร"
                    name="course"
                    icon={<SchoolIcon sx={{ color: "#00796b" }} />}
                    formik={formik}
                    select
                    options={courseOptions}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
              </Grid>

              {/* ✅ ช่อง หลักสูตร และ ภาคการศึกษา */}
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="ปีการศึกษา"
                    name="academicYear"
                    icon={<SchoolIcon sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="ภาคการศึกษา"
                    name="semester"
                    icon={<SchoolIcon sx={{ color: "#00796b" }} />}
                    formik={formik}
                    select
                    options={semesterOptions}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
              </Grid>

              {/* ช่อง อีเมล และ เบอร์โทรศัพท์ */}
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="อีเมล"
                    name="email"
                    icon={<Email sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="เบอร์โทรศัพท์"
                    name="phone"
                    icon={<Phone sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
              </Grid>

              {/* ช่อง ชื่อสถานประกอบการ และ ตำแหน่งฝึกงาน */}
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="ชื่อสถานประกอบการ"
                    name="companyName"
                    icon={<WorkIcon sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="ตำแหน่งฝึกงาน"
                    name="internPosition"
                    icon={<WorkIcon sx={{ color: "#00796b" }} />}
                    formik={formik}
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
              </Grid>

              {/* ช่อง รหัสผ่าน และ ยืนยันรหัสผ่าน */}
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="รหัสผ่าน"
                    name="password"
                    icon={<Lock sx={{ color: "#00796b" }} />}
                    formik={formik}
                    type="password"
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomField
                    label="ยืนยันรหัสผ่าน"
                    name="confirmPassword"
                    icon={<LockReset sx={{ color: "#00796b" }} />}
                    formik={formik}
                    type="password"
                    setValidatePassword={setValidatePassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  {formik.values.password && (
                    <Box sx={{ mt: -1, pl: 2, mb: 1 }}>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: "10px",
                          color:
                            validatePassword.hasMinLength &&
                            validatePassword.hasMaxLength
                              ? "green"
                              : "red",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        ตัวอักษร 8-16 ตัว
                      </Typography>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: "10px",
                          color: validatePassword.hasLowercase
                            ? "green"
                            : "red",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        ตัวพิมพ์เล็กอย่างน้อย 1 ตัว
                      </Typography>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: "10px",
                          color: validatePassword.hasUppercase
                            ? "green"
                            : "red",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
                      </Typography>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: "10px",
                          color: validatePassword.hasNumber ? "green" : "red",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        ตัวเลขอารบิกอย่างน้อย 1 ตัว
                      </Typography>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: "10px",
                          color: validatePassword.hasOnlyAlphanumeric
                            ? "green"
                            : "red",
                          fontFamily: '"Kanit", sans-serif',
                        }}
                      >
                        สามารถใช้ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลขอารบิก
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              {formik.errors.api && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {formik.errors.api}
                </Alert>
              )}
            </Grid>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontWeight: 700,
                  backgroundColor: "#00796b",
                  borderRadius: 3,
                  fontSize: isSmallScreen ? "1rem" : "1.1rem",
                  "&:hover": {
                    backgroundColor: "#024f46",
                    boxShadow: "0 4px 12px rgba(0,91,181,0.4)",
                  },
                  textTransform: "none",
                  fontFamily: '"Kanit", sans-serif',
                }}
                disabled={formik.isSubmitting}
              >
                ลงทะเบียน
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                fullWidth
                sx={{
                  mt: 2,
                  textTransform: "none",
                  color: "#00796b",
                  fontWeight: 600,
                  fontSize: isSmallScreen ? "1rem" : "1em",
                  "&:hover": {
                    textDecoration: "underline",
                    backgroundColor: "transparent",
                  },
                  fontFamily: '"Kanit", sans-serif',
                }}
                onClick={() => navigate("/")}
                startIcon={<ArrowBack />}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </motion.div>
          </form>
        </Box>
      </motion.div>
    </Box>
  );
}

export default RegisterPage;