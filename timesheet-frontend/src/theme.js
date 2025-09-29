// src/theme.js
import { createTheme } from "@mui/material/styles";

const baseFont =
  'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const theme = createTheme({
  typography: {
    fontFamily: baseFont, // ครอบทั้งระบบ
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": { fontFamily: baseFont },
        // เผื่อ SweetAlert2 (มีใน index.css แล้ว แต่เสริมไว้ที่นี่อีกชั้น)
        ".swal2-popup, .swal2-title, .swal2-html-container, .swal2-confirm, .swal2-cancel": {
          fontFamily: baseFont,
        },
      },
    },
    // คอมโพเนนต์ที่มักไม่สืบฟอนต์เอง
    MuiInputBase:      { styleOverrides: { root: { fontFamily: baseFont } } },
    MuiInputLabel:     { styleOverrides: { root: { fontFamily: baseFont } } },
    MuiFormHelperText: { styleOverrides: { root: { fontFamily: baseFont } } },
    MuiSelect:         { styleOverrides: { select: { fontFamily: baseFont } } },
    MuiMenuItem:       { styleOverrides: { root: { fontFamily: baseFont } } },
    MuiButton:         { styleOverrides: { root: { fontFamily: baseFont } } },
    MuiAlert:          { styleOverrides: { message: { fontFamily: baseFont } } },
    MuiTypography:     { styleOverrides: { root: { fontFamily: baseFont } } },
    MuiSnackbarContent:{ styleOverrides: { message: { fontFamily: baseFont } } },
  },
});

export default theme;
