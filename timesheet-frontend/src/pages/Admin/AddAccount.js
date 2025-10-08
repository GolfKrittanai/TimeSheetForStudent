import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  // FormControl, // REMOVED
  // InputLabel, // REMOVED
  // Select, // REMOVED
  // MenuItem, // REMOVED
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../services/authService";

/* --------------------------- ฟังก์ชันเช็ค password (ปรับปรุงใหม่) --------------------------- */
// เงื่อนไข: 1. พิมพ์เล็ก 2. พิมพ์ใหญ่ 3. 8-16 ตัว 4. อนุญาตอักขระพิเศษ
const handlePasswordValidate = (value) => {
  const hasMinLength = value.length >= 8;
  const hasMaxLength = value.length <= 16;
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  
  // อักขระที่อนุญาต: A-Z, a-z, 0-9, และเครื่องหมายปกติ (อักขระพิเศษที่พบบ่อย)
  const hasValidChars = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value);

  return {
    hasMinLength: hasMinLength && hasMaxLength, // รวม min/max (8-16)
    hasLowercase,
    hasUppercase,
    hasValidChars, 
  };
};
/* -------------------------------------------------------------------------- */


function AddAccount() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [errors, setErrors] = React.useState({});
  
  // State สำหรับเก็บผลการตรวจสอบรหัสผ่าน
  const [passwordValidation, setPasswordValidation] = React.useState({});
  // State สำหรับเช็คว่ามีการเริ่มพิมพ์รหัสผ่านแล้วหรือไม่
  const [passwordTouched, setPasswordTouched] = useState(false);


  const [formData, setFormData] = useState({
    // FIXED ROLE: Set the role to 'teacher' as it is no longer user-selectable.
    role: "teacher",
    studentId: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // --- ตรวจสอบช่องว่าง (Required Fields) ---
    if (!formData.studentId || formData.studentId.trim() === "") {
      newErrors.studentId = "กรุณากรอกรหัสอาจารย์";
    }
    if (!formData.fullName || formData.fullName.trim() === "") {
      newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
    }
    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "กรุณากรอกอีเมล";
    }
    if (!formData.phone || formData.phone.trim() === "") {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    }
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    }

    // --- ตรวจสอบความสอดคล้อง/ความถูกต้อง (Consistency/Format Checks) ---

    // 1. ตรวจสอบการตรงกันของรหัสผ่าน
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
    }

    // 2. ตรวจสอบเงื่อนไขรหัสผ่าน 
    // Regex ใหม่: ต้องมีพิมพ์เล็ก, พิมพ์ใหญ่, และความยาว 8-16
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;
    
    // ตรวจสอบอักขระที่อนุญาต (ตัวอักษร, ตัวเลข, อักขระปกติ)
    const validCharsRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;

    if (formData.password) {
        if (!passwordRegex.test(formData.password)) {
             newErrors.password = "รหัสผ่านไม่ตรงตามเงื่อนไข (8-16 ตัวอักษร, มีพิมพ์เล็ก/ใหญ่)";
        }
        if (!validCharsRegex.test(formData.password)) {
             newErrors.password = "รหัสผ่านมีอักขระที่ไม่ได้รับอนุญาต";
        }
    }


    // อัปเดต State ข้อผิดพลาด
    setErrors(newErrors);

    // ส่งคืนค่า true ถ้าไม่มีข้อผิดพลาด
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));

    // อัปเดตการตรวจสอบรหัสผ่านทุกครั้งที่มีการพิมพ์ (หรือลบ)
    if (name === "password") {
        if (!passwordTouched && value.length > 0) {
            // เมื่อเริ่มพิมพ์ครั้งแรก
            setPasswordTouched(true);
        } else if (value.length === 0) {
            // เมื่อลบจนหมด ให้กลับไปเป็นสีเทา
            setPasswordTouched(false);
            setPasswordValidation({}); // Clear validation state
        }
        
        // อัปเดตผลการตรวจสอบเมื่อมีการพิมพ์
        const validation = handlePasswordValidate(value);
        setPasswordValidation(validation);
    }
  };

  const handleTogglePassword = (field) => {
    if (field === "password") {
      setShowPassword((prev) => !prev);
    } else {
      setConfirmPassword((prev) => !prev);
    }
  };

  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ตรวจสอบเงื่อนไขรหัสผ่านเมื่อกด Submit หากยังไม่ได้เริ่มพิมพ์
    if (formData.password && !passwordTouched) {
        setPasswordTouched(true);
        setPasswordValidation(handlePasswordValidate(formData.password));
    }

    if (!validateForm()) {
      return;
    }

    try {
      await registerUser(formData, token);

      Swal.fire({
        title: "เพิ่มบัญชีสำเร็จ",
        text: "ผู้ใช้ใหม่ถูกเพิ่มเข้าสู่ระบบแล้ว",
        icon: "success",
        confirmButtonColor: "#00796b",
      });
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text:
          "ไม่สามารถเพิ่มบัญชีได้ " +
          (error.response?.data?.message || "โปรดตรวจสอบข้อมูล"),
        icon: "error",
        confirmButtonColor: "#00796b",
      });
    }
  };

  // Custom styles for text fields to match the image
  const inputStyle = {
    "& .MuiInputBase-root": {
      fontFamily: '"Kanit", sans-serif',
      borderRadius: 2,
      bgcolor: "#fafafa",
      // Set height or padding slightly larger to match the image fields
      height: "40px", // Adjusted height
      "& input": {
        padding: "8px 14px", // Adjusted padding
      },
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
    "& .MuiInputLabel-root": {
      transform: "translate(14px, 11px) scale(1)", // Center label
      "&.Mui-focused": {
        color: "#00796b",
      },
      "&.MuiInputLabel-shrink": {
        transform: "translate(14px, -9px) scale(0.75)", // Adjusted for smaller height
      },
    },
  };

  // Define color constants for buttons
  const PRIMARY_COLOR = "#00796b"; // Dark Teal/Green for Register
  // Using a specific light teal/green from the image
  const LIGHT_BUTTON_COLOR = "#d2e0df"; // Light Teal/Green for Back

  // ฟังก์ชันช่วยกำหนดสีเขียว/แดง/เทา
  const getValidationColor = (isValid, defaultValue = '#777') => {
    // ถ้ายังไม่เริ่มพิมพ์ ให้เป็นสีเทาตาม default
    if (!passwordTouched) return defaultValue; 
    // ถ้าเริ่มพิมพ์แล้ว ให้เป็นสีเขียว/แดงตามผลการตรวจสอบ
    return isValid ? 'green' : 'red';
  };
  
  // *** Logic สำหรับเงื่อนไขที่ 4: ต้องผ่าน 3 เงื่อนไขแรกก่อน ***
  const isCoreConditionsMet = 
      passwordValidation.hasMinLength && 
      passwordValidation.hasLowercase && 
      passwordValidation.hasUppercase;

  const getValidCharsColor = () => {
      // ถ้ายังไม่เริ่มพิมพ์ ให้เป็นสีเทาตาม default
      if (!passwordTouched) return '#777';

      // 1. ถ้า 3 เงื่อนไขหลัก (ความยาว, พิมพ์เล็ก, พิมพ์ใหญ่) ผ่านหมด
      if (isCoreConditionsMet) {
          // จะเป็นสีเขียว หากอักขระที่กรอกมาถูกต้อง
          return passwordValidation.hasValidChars ? 'green' : 'red';
      } else {
          // 2. ถ้า 3 เงื่อนไขหลักยังไม่ผ่าน
          // จะเป็นสีแดงทันที หากอักขระไม่ถูกต้อง
          if (!passwordValidation.hasValidChars) {
              return 'red';
          }
          // และจะเป็นสีเทา หากอักขระถูกต้อง แต่ 3 เงื่อนไขหลักยังไม่ผ่าน
          return '#777'; 
      }
  };


  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          mt: isSmallScreen ? 5 : 0,
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
          fontFamily: '"Kanit", sans-serif',
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1150 }}>
          <Typography
            variant={isSmallScreen ? "h5" : "h4"}
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: PRIMARY_COLOR,
              mb: 3,
              textAlign: "left",
              fontFamily: '"Kanit", sans-serif',
            }}
          >
            เพิ่มบัญชี
          </Typography>

          <Paper
            elevation={3}
            sx={{ p: isSmallScreen ? 2 : 4, borderRadius: 2 }}
          >
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Typography sx={{ mb: 0.5 }}>
                    รหัสอาจารย์
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    placeholder="รหัสอาจารย์"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={inputStyle}
                    required
                    error={!!errors.studentId}
                    helperText={errors.studentId} // แสดงข้อความ error
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ my: 1 }}>
                <Grid item xs={12}>
                  <Typography sx={{ mb: 0.5 }}>
                    ชื่อ-นามสกุล
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    placeholder="ชื่อ-นามสกุล"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    InputProps={{
                      startAdornment: (
                        <Box
                          sx={{
                            mr: 1,
                            color: "#555",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          👤
                        </Box>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ my: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 0.5 }}>
                    อีเมล
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    placeholder="อีเมล"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    // เพิ่ม Error/HelperText
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 0.5 }}>
                    เบอร์โทรศัพท์
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    placeholder="เบอร์โทรศัพท์"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    // เพิ่ม Error/HelperText
                    error={!!errors.phone}
                    helperText={errors.phone}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ my: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ mb: 0.5 }}>
                    รหัสผ่าน
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    placeholder="รหัสผ่าน"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <LockIcon sx={{ mr: 1, color: "#555" }} />
                      ),
                      endAdornment: (
                        <IconButton
                          onClick={() => handleTogglePassword("password")}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityIcon />
                          ) : (
                            <VisibilityOffIcon />
                          )}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {/* 1. Typography พร้อมดอกจันสีแดง และ Margin Bottom */}
                  <Typography sx={{ mb: 0.5 }}>
                    ยืนยันรหัสผ่าน
                    <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง" // 4. เพิ่ม placeholder
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    fullWidth
                    required
                    size="small"
                    sx={inputStyle}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <LockIcon sx={{ mr: 1, color: "#555" }} />
                      ),
                      endAdornment: (
                        <IconButton
                          onClick={() =>
                            handleTogglePassword("confirmPassword")
                          }
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? (
                            <VisibilityIcon />
                          ) : (
                            <VisibilityOffIcon />
                          )}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Password Requirements Text พร้อมสีเขียว/แดง/เทา */}
              <Box sx={{ mt: 1, mb: 4, fontSize: "0.8rem", color: "#777", pl: 1 }}>
                <Typography variant="caption" display="block" sx={{ color: getValidationColor(passwordValidation.hasLowercase) }}>
                  ตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: getValidationColor(passwordValidation.hasUppercase) }}>
                  ตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว
                </Typography>
                 <Typography variant="caption" display="block" sx={{ color: getValidationColor(passwordValidation.hasMinLength) }}>
                  รหัสผ่านมีความยาว 8-16 ตัวอักษร
                </Typography>
                 {/* ใช้ getValidCharsColor ใหม่เพื่อบังคับให้ 3 เงื่อนไขแรกผ่านก่อน */}
                 <Typography variant="caption" display="block" sx={{ color: getValidCharsColor() }}>
                  สามารถใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลขอาราบิก และ เครื่องหมายปกติ
                </Typography>
              </Box>

              {/* Submit and Back Buttons - Matches image layout and colors */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={handleBack}
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.5,
                      backgroundColor: LIGHT_BUTTON_COLOR,
                      color: PRIMARY_COLOR,
                      "&:hover": {
                        backgroundColor: "#b2c8c6",
                        boxShadow: "none",
                      },
                      textTransform: "none",
                      fontWeight: "bold",
                      fontFamily: '"Kanit", sans-serif',
                      boxShadow: "none",
                    }}
                  >
                    ย้อนกลับ
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.5,
                      backgroundColor: PRIMARY_COLOR,
                      "&:hover": { backgroundColor: "#005a4d" },
                      textTransform: "none",
                      fontWeight: "bold",
                      fontFamily: '"Kanit", sans-serif',
                      boxShadow: "none",
                    }}
                  >
                    ลงทะเบียน
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default AddAccount;