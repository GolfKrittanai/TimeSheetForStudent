// src/pages/RegisterPage.js
import React from "react";
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
  IconButton,
  Paper,
} from "@mui/material";
import {
  AccountCircle,
  Badge,
  School as SchoolIcon,
  Email,
  Phone,
  Work as WorkIcon,
  Lock,
  LockReset,
  ArrowBack,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ----------------------------- ตัวเลือก select ----------------------------- */
const courseOptions = ["2 ปี", "4 ปี"];
const semesterOptions = ["1", "2", "3 (ฤดูร้อน)"];

/* ------------------------------- TextField สไตล์ ------------------------------- */
// const StyledTextField = styled(TextField)(({ theme }) => ({
//   "& .MuiInputBase-root": {
//     borderRadius: 14,
//     backgroundColor: "#f9fbfb",
//     transition: "border-color .15s ease, box-shadow .15s ease",
//     "& .MuiOutlinedInput-notchedOutline": {
//       borderColor: "#cfd8dc",
//     },
//     "&:hover .MuiOutlinedInput-notchedOutline": {
//       borderColor: "#0b7a6b",
//     },
//     "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
//       borderColor: "#0b7a6b",
//       boxShadow: "0 0 0 3px rgba(11,122,107,.15)",
//     },
//   },
// }));

// ใช้สไตล์เดียวกับหน้า Login
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

const FieldLabel = ({ children, required }) => (
  <Typography
    sx={{
      fontSize: 13,        // ← ทำให้เล็กลง
      lineHeight: 1.2,
      color: "#455a64",
      mb: 0.5,             // ระยะห่างระหว่าง label กับช่อง
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      fontWeight: 500,
    }}
  >
    {children}
    {required && (
      <Box component="span" sx={{ color: "#e53935", fontSize: 14 }}>*</Box>
    )}
  </Typography>
);

/* --------------------------- ฟังก์ชันเช็ค password --------------------------- */
const handlePasswordValidate = (value) => {
  const hasMinLength = value.length >= 8;
  const hasMaxLength = value.length <= 16;
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasOnlyAlphanumeric = /^[A-Za-z0-9]*$/.test(value);
  return {
    hasMinLength,
    hasMaxLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasOnlyAlphanumeric,
  };
};

/* ------------------------------ CustomField ------------------------------ */
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
  setValidatePassword,
  required = false,
}) {
  const [show, setShow] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const isPassword = type === "password";
  const showErrors = formik.submitCount > 0;

  return (
    <>
      {/* ให้มีหัวข้ออยู่ด้านบนเหมือนหน้า Login */}
      <FieldLabel required={required}>{label}</FieldLabel>

      <TextField
        // ไม่ใช้ prop label แล้ว ให้ใช้หัวข้อด้านบน + placeholder ในช่อง
        name={name}
        size="medium"
        margin="none"
        //placeholder={label}
        type={isPassword ? (show ? "text" : "password") : type}
        required={required}
        fullWidth
        variant="outlined"
        select={select}
        value={formik.values[name]}
        onChange={(e) => {
          formik.handleChange(e);
          if (name === "password" && setValidatePassword) {
            const validation = handlePasswordValidate(e.target.value);
            setValidatePassword(validation);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        rows={rows}
        error={showErrors && Boolean(formik.errors[name])}
        helperText={
          showErrors && formik.errors[name] ? formik.errors[name] : " "
        }
        FormHelperTextProps={{ sx: { mt: 0.25, fontSize: 12, lineHeight: 1.2, m: 0 } }}
        InputProps={{
          startAdornment: icon ? (
            <InputAdornment position="start">{icon}</InputAdornment>
          ) : undefined,
          endAdornment:
            isPassword && (focused || !!formik.values[name]) ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShow((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                  sx={{ color: "#0b7a6b" }}
                  aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {show ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ) : undefined,
          // <<— ใช้สไตล์เดียวกับ Login
          sx: textFieldSx,
        }}
      // ไม่ต้องใช้ InputLabelProps อีกต่อไป เพราะเราแยกหัวข้อไว้ด้านบนแล้ว
      >
        {select &&
          options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
      </TextField>
    </>
  );
}

/* ---------------------------------- หน้าเพจ ---------------------------------- */
export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [validatePassword, setValidatePassword] = React.useState({});
  const API = process.env.REACT_APP_API; // eg. http://localhost:5000/api

  const RegisterSchema = Yup.object({
    fullName: Yup.string().required("กรอกชื่อ-นามสกุล"),
    studentId: Yup.string().required("กรอกรหัสประจำตัว"),
    course: Yup.string().required("เลือกหลักสูตร"),
    semester: Yup.string().required("เลือกภาคการศึกษา"),
    academicYear: Yup.string().required("กรอกปีการศึกษา"),
    email: Yup.string().email("อีเมลไม่ถูกต้อง").required("กรอกอีเมล"),
    phone: Yup.string().required("กรอกเบอร์โทรศัพท์"),
    companyName: Yup.string().required("กรอกชื่อสถานประกอบการ"),
    internPosition: Yup.string().required("กรอกตำแหน่งฝึกงาน"),
    password: Yup.string()
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/,
        "รหัสผ่านไม่ตรงตามเงื่อนไข"
      )
      .required("กรอกรหัสผ่าน"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "ยืนยันรหัสผ่านไม่ตรง")
      .required("ยืนยันรหัสผ่าน"),
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
    validationSchema: RegisterSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const payload = {
          studentId: values.studentId.trim(),
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password,
          role: "student",
          course: values.course || undefined,
          semester: values.semester || undefined,
          academicYear: values.academicYear || undefined,
          companyName: values.companyName || undefined,
          internPosition: values.internPosition || undefined,
        };
        Object.keys(payload).forEach(
          (k) => payload[k] === undefined && delete payload[k]
        );

        await axios.post(`${API}/auth/register`, payload);

        await Swal.fire({
          icon: "success",
          title: "ลงทะเบียนสำเร็จ",
          confirmButtonColor: "#0b7a6b",
        });
        navigate("/");
      } catch (err) {
        const msg =
          err?.response?.data?.message || "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่";
        if (msg.includes("อีเมล")) setFieldError("email", msg);
        if (msg.includes("รหัสนักศึกษา")) setFieldError("studentId", msg);
        Swal.fire({
          icon: "error",
          title: "ลงทะเบียนไม่สำเร็จ",
          text: msg,
          confirmButtonColor: "#0b7a6b",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#eef3f5",
        py: { xs: 3, md: 6 },
      }}
    >
      {/* ส่วนหัว */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography sx={{ color: "#4f5b62", mb: 0.5, fontWeight: 600 }}>
          ลงทะเบียน
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 38, sm: 44 },
            fontWeight: 800,
            letterSpacing: 4,
            color: "#0b7a6b",
          }}
        >
          TIMESHEET
        </Typography>
        <Typography sx={{ color: "#4f5b62", mt: 0.5 }}>
          สำหรับนักศึกษา BIS
        </Typography>
      </Box>

      {/* Card ฟอร์ม */}
      <Box sx={{ maxWidth: 780, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #cfd8dc",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* Section Header */}
          <Box
            sx={{
              px: 3,
              py: 1.3,
              bgcolor: "#0b7a6b",
              color: "#fff",
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            ข้อมูลนักศึกษา
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container columnSpacing={1.5}>
              {/* ชื่อ-นามสกุล */}
              <Grid item xs={12}>
                <CustomField
                  label="ชื่อ-นามสกุล"
                  name="fullName"
                  icon={<AccountCircle sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>

              {/* รหัสประจำตัว & หลักสูตร */}
              <Grid item xs={12} sm={6}>
                <CustomField
                  label="รหัสประจำตัว"
                  name="studentId"
                  icon={<Badge sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
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
                  required
                />
              </Grid>

              {/* ปีการศึกษา & ภาคการศึกษา */}
              <Grid item xs={12} sm={6}>
                <CustomField
                  label="ปีการศึกษา"
                  name="academicYear"
                  icon={<SchoolIcon sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
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
                  required
                />
              </Grid>

              {/* อีเมล & เบอร์โทรศัพท์ */}
              <Grid item xs={12} sm={6}>
                <CustomField
                  label="อีเมล"
                  name="email"
                  icon={<Email sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomField
                  label="เบอร์โทรศัพท์"
                  name="phone"
                  icon={<Phone sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>

              {/* ชื่อสถานประกอบการ & ตำแหน่งฝึกงาน */}
              <Grid item xs={12} sm={6}>
                <CustomField
                  label="ชื่อสถานประกอบการ"
                  name="companyName"
                  icon={<WorkIcon sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomField
                  label="ตำแหน่งฝึกงาน"
                  name="internPosition"
                  icon={<WorkIcon sx={{ color: "#00796b" }} />}
                  formik={formik}
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>

              {/* รหัสผ่าน & ยืนยันรหัสผ่าน */}
              <Grid item xs={12}>
                <CustomField
                  label="รหัสผ่าน"
                  name="password"
                  icon={<Lock sx={{ color: "#00796b" }} />}
                  formik={formik}
                  type="password"
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <CustomField
                  label="ยืนยันรหัสผ่าน"
                  name="confirmPassword"
                  icon={<LockReset sx={{ color: "#00796b" }} />}
                  formik={formik}
                  type="password"
                  setValidatePassword={setValidatePassword}
                  required
                />
              </Grid>

              {/* ตัวช่วยเงื่อนไขรหัสผ่าน */}
              <Grid item xs={12}>
                {formik.values.password && (
                  <Box sx={{ mt: -1, pl: 1, mb: 1 }}>
                    <Typography component="p" sx={{
                      fontSize: "12px", color:
                        validatePassword.hasMinLength && validatePassword.hasMaxLength ? "green" : "red"
                    }}>
                      ตัวอักษร 8–16 ตัว
                    </Typography>
                    <Typography component="p" sx={{ fontSize: "12px", color: validatePassword.hasLowercase ? "green" : "red" }}>
                      ตัวพิมพ์เล็กอย่างน้อย 1 ตัว
                    </Typography>
                    <Typography component="p" sx={{ fontSize: "12px", color: validatePassword.hasUppercase ? "green" : "red" }}>
                      ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
                    </Typography>
                    <Typography component="p" sx={{ fontSize: "12px", color: validatePassword.hasNumber ? "green" : "red" }}>
                      ตัวเลขอารบิกอย่างน้อย 1 ตัว
                    </Typography>
                    <Typography component="p" sx={{
                      fontSize: "12px", color:
                        validatePassword.hasOnlyAlphanumeric ? "green" : "red"
                    }}>
                      ใช้ได้เฉพาะตัวอักษรอังกฤษและตัวเลข
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Error จาก API */}
              {formik.errors.api && (
                <Grid item xs={12}>
                  <Alert severity="error">{formik.errors.api}</Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>

        {/* ✅ ปุ่มอยู่นอกการ์ด ตามดีไซน์ */}
        <Box sx={{ mt: 3 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              form="register-form" // (ไม่จำเป็นเพราะเรา submit จากปุ่มนี้ด้วย onClick)
              onClick={formik.handleSubmit}
              fullWidth
              variant="contained"
              disabled={formik.isSubmitting}
              sx={{
                py: 1.25,
                fontWeight: 500,
                backgroundColor: "#0b7a6b",
                borderRadius: 3,
                textTransform: "none",
                //boxShadow: "0 4px 10px rgba(11,122,107,.25)",
                "&:hover": {
                  backgroundColor: "#095f52",
                  boxShadow: "0 6px 14px rgba(11,122,107,.28)",
                },
              }}
            >
              ลงทะเบียน
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              fullWidth
              startIcon={<ArrowBack />}
              onClick={() => navigate("/")}
              sx={{
                mt: 1.5,
                color: "#0b7a6b",
                fontWeight: 500,
                textTransform: "none",
                bgcolor: "#e7efee",
                borderRadius: 3,
                "&:hover": {
                  bgcolor: "#dbe7e5",
                },
              }}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
