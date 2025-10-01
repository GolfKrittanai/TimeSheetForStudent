import React, { useState, useMemo } from "react";
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    InputAdornment,
    IconButton,
    Paper,
} from "@mui/material";
import Swal from "sweetalert2";
import { changePassword } from "../services/userService";
import LockIcon from '@mui/icons-material/Lock';
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

/* ---------- สไตล์ TextField: ให้เหมือนหน้า Register ---------- */
const textFieldSx = {
    borderRadius: 2,
    backgroundColor: "#ffffff",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cfd8dc" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0b7a6b" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0b7a6b" },
    "&.Mui-disabled": { backgroundColor: "#f9fbfb" },
    "& .MuiOutlinedInput-input.Mui-disabled": { WebkitTextFillColor: "#546e7a" },
};
/* ---------- Label แบบอยู่เหนือช่อง ---------- */
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

/**
 * แท็บเปลี่ยนรหัสผ่าน — error ขึ้นหลัง submit เท่านั้น
 * กติกาเหมือน Register และซ่อน bullet จนกว่าจะเริ่มกรอก "รหัสผ่านใหม่"
 */
export default function ResetPasswordTab({ token, onBack }) {
    const [pwd, setPwd] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [saving, setSaving] = useState(false);
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [showErrors, setShowErrors] = useState(false);

    // แสดง bullet guideline เฉพาะตอนเริ่มกรอก/มีค่าใน newPassword
    const [showGuideline, setShowGuideline] = useState(false);

    // ---- Validate แบบเดียวกับ Register ----
    const handlePasswordValidate = (value) => {
        const hasMinLength = value.length >= 8;
        const hasMaxLength = value.length <= 16;
        const hasLowercase = /[a-z]/.test(value);
        const hasUppercase = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasOnlyAlphanumeric = value.length > 0 && /^[A-Za-z0-9]*$/.test(value); // กันค่าว่างเป็นเขียว
        return {
            hasMinLength,
            hasMaxLength,
            hasLowercase,
            hasUppercase,
            hasNumber,
            hasOnlyAlphanumeric,
        };
    };
    const [validate, setValidate] = useState(handlePasswordValidate(""));

    const onChange = (e) => {
        const { name, value } = e.target;
        setPwd((prev) => ({ ...prev, [name]: value }));
        if (name === "newPassword") {
            setValidate(handlePasswordValidate(value));
            setShowGuideline(value.length > 0); // เริ่มพิมพ์แล้วค่อยโชว์กติกา
        }
    };

    const handleToggle = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

    // invalid ของ "รหัสผ่านใหม่" — แสดงกรอบแดงเฉพาะตอนกด submit
    const newPwInvalid = useMemo(() => {
        if (!showErrors) return false;
        const v = pwd.newPassword;
        const pass =
            /[a-z]/.test(v) &&
            /[A-Z]/.test(v) &&
            /\d/.test(v) &&
            v.length >= 8 &&
            v.length <= 16 &&
            /^[A-Za-z0-9]*$/.test(v);
        return !pass;
    }, [pwd.newPassword, showErrors]);

    const confirmInvalid =
        showErrors && (!!pwd.confirmPassword ? pwd.confirmPassword !== pwd.newPassword : true);

    const formMissing =
        !pwd.currentPassword || !pwd.newPassword || !pwd.confirmPassword;

    const onSubmit = async (e) => {
        e.preventDefault();
        setShowErrors(true);
        if (formMissing || newPwInvalid || confirmInvalid) return;

        setSaving(true);
        try {
            await changePassword(pwd.currentPassword, pwd.newPassword, token);
            setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setValidate(handlePasswordValidate(""));
            setShowErrors(false);
            setShowGuideline(false);
            Swal.fire({ icon: "success", title: "เปลี่ยนรหัสผ่านสำเร็จ" });
            onBack?.();
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
                text: "โปรดลองอีกครั้งหรือตรวจสอบรหัสผ่านเดิม",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 } }}>
            {/* หัวข้อ + ไอคอน */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 500, color: "#0b7a6b", mb: 2 }}>
                    เปลี่ยนรหัสผ่าน
                </Typography>
                <Box
                    sx={{
                        width: 96,
                        height: 96,
                        //borderRadius: "50%",
                        mx: "auto",
                        display: "grid",
                        placeItems: "center",
                        //border: "4px solid #0b7a6b",
                    }}
                >
                    <LockIcon sx={{ fontSize: 96, color: "#0b7a6b" }} />
                </Box>
            </Box>

            {/* ฟอร์ม */}
            <Box component="form" noValidate onSubmit={onSubmit}>
                <Grid container spacing={2.4}>
                    {/* รหัสผ่านปัจจุบัน */}
                    <Grid item xs={12}>
                        <FieldLabel required>รหัสผ่านปัจจุบัน</FieldLabel>
                        <TextField
                            type={show.current ? "text" : "password"}
                            name="currentPassword"
                            value={pwd.currentPassword}
                            onChange={onChange}
                            fullWidth
                            required
                            error={showErrors && !pwd.currentPassword}
                            helperText={showErrors && !pwd.currentPassword ? "กรอกรหัสผ่านปัจจุบัน" : " "}
                            InputProps={{
                                sx: textFieldSx,
                                endAdornment:
                                    pwd.currentPassword?.length > 0 ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleToggle("current")}
                                                edge="end"
                                                aria-label="toggle current password"
                                            >
                                                {show.current ? (
                                                    <VisibilityRoundedIcon />           // ขณะโชว์ → ตาเปิด
                                                ) : (
                                                    <VisibilityOffRoundedIcon />        // ขณะซ่อน → ตาปิด
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,                                    // ว่าง → ไม่แสดงไอคอน
                            }}
                        />
                    </Grid>

                    {/* รหัสผ่านใหม่ */}
                    <Grid item xs={12}>
                        <FieldLabel required>รหัสผ่านใหม่</FieldLabel>
                        <TextField
                            type={show.next ? "text" : "password"}
                            name="newPassword"
                            value={pwd.newPassword}
                            onChange={onChange}
                            onFocus={() => setShowGuideline(true)}
                            onBlur={() => { if (!pwd.newPassword) setShowGuideline(false); }}
                            fullWidth
                            required
                            error={newPwInvalid}
                            helperText={newPwInvalid ? "รูปแบบรหัสผ่านไม่ตรงตามเงื่อนไข" : " "}
                            InputProps={{
                                sx: textFieldSx,
                                endAdornment:
                                    pwd.newPassword?.length > 0 ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleToggle("next")}
                                                edge="end"
                                                aria-label="toggle new password"
                                            >
                                                {show.next ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                            }}
                        />
                        {/* กติกา (ซ่อนจนกว่าจะเริ่มกรอก/โฟกัส) */}
                        {showGuideline && (
                            <Box sx={{ mt: -1, pl: 1, mb: 1 }}>
                                <Typography component="p" sx={{ fontSize: 12, color: (validate.hasMinLength && validate.hasMaxLength) ? "green" : "red" }}>
                                    ตัวอักษร 8–16 ตัว
                                </Typography>
                                <Typography component="p" sx={{ fontSize: 12, color: validate.hasLowercase ? "green" : "red" }}>
                                    ตัวพิมพ์เล็กอย่างน้อย 1 ตัว
                                </Typography>
                                <Typography component="p" sx={{ fontSize: 12, color: validate.hasUppercase ? "green" : "red" }}>
                                    ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
                                </Typography>
                                <Typography component="p" sx={{ fontSize: 12, color: validate.hasNumber ? "green" : "red" }}>
                                    ตัวเลขอารบิกอย่างน้อย 1 ตัว
                                </Typography>
                                <Typography component="p" sx={{ fontSize: 12, color: validate.hasOnlyAlphanumeric ? "green" : "red" }}>
                                    ใช้ได้เฉพาะตัวอักษรอังกฤษและตัวเลข
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    {/* ยืนยันรหัสผ่านใหม่ */}
                    <Grid item xs={12}>
                        <FieldLabel required>ยืนยันรหัสผ่านใหม่</FieldLabel>
                        <TextField
                            type={show.confirm ? "text" : "password"}
                            name="confirmPassword"
                            value={pwd.confirmPassword}
                            onChange={onChange}
                            fullWidth
                            required
                            error={confirmInvalid}
                            helperText={
                                confirmInvalid
                                    ? (!!pwd.confirmPassword ? "รหัสผ่านไม่ตรงกัน" : "กรอกยืนยันรหัสผ่าน")
                                    : " "
                            }
                            InputProps={{
                                sx: textFieldSx,
                                endAdornment:
                                    pwd.confirmPassword?.length > 0 ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleToggle("confirm")}
                                                edge="end"
                                                aria-label="toggle confirm password"
                                            >
                                                {show.confirm ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null,
                            }}
                        />
                    </Grid>
                </Grid>

                {/* ปุ่มล่าง */}
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ maxWidth: 560, mx: "auto" }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    type="button"
                                    fullWidth
                                    variant="outlined"
                                    onClick={onBack}
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
                                    เปลี่ยนรหัสผ่าน
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
}
