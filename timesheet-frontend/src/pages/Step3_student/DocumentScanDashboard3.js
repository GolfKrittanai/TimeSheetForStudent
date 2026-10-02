import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const BRAND_DARK = "#00423b";

function DocumentScanDashboard3() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ข้อมูลเอกสารการส่งตัว
  const [dispatchDocs] = useState([
    {
      id: 1,
      title: "หนังสือขอความอนุเคราะห์",
      subTitle: "หนังสือขอความอนุเคราะห์จากสถานประกอบการ",
      count: "1 ฉบับ",
      uploadDate: "19 มกราคม 2569",
    },
    {
      id: 2,
      title: "เอกสารการประเมิน",
      subTitle: "แบบฟอร์มการประเมินผลการปฏิบัติงาน",
      count: "1 ฉบับ",
      uploadDate: "19 มกราคม 2569",
    },
  ]);

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSmallScreen ? 2 : 4,
          fontFamily: '"Kanit", sans-serif',
          overflowX: "hidden",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#000000",
              mb: 0.5,
              fontSize: isSmallScreen ? "1.5rem" : "1.8rem",
            }}
          >
            ระบบสแกนเอกสารก่อนสหกิจศึกษา
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#00423b", fontWeight: 500, fontSize: "0.95rem" }}
          >
            ตรวจสอบข้อมูลของท่านให้ครบถ้วน ก่อนออกสหกิจ
          </Typography>
        </Box>

        {/* Action Cards (2 การ์ดด้านบน) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* การ์ดบันทึกกิจกรรม */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: "#e8f5e9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "#005c47",
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 30, color: "#ffffff" }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: "#000000", lineHeight: 1.2 }}
                  >
                    บันทึกกิจกรรม
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.75rem" }}>
                    เพิ่มกิจกรรมระหว่างสหกิจ
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/student/activity-log")}
                sx={{
                  bgcolor: "#005c47",
                  color: "#ffffff",
                  borderRadius: "20px",
                  px: 2.5,
                  py: 1,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#00423b" },
                }}
              >
                บันทึกกิจกรรม
              </Button>
            </Paper>
          </Grid>

          {/* การ์ดเอกสารการประเมิน */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: "#fff3e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "#e67e22",
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 30, color: "#ffffff" }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: "#000000", lineHeight: 1.2 }}
                  >
                    เอกสารการประเมิน
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.75rem" }}>
                    สำหรับการดูเอกสารการประเมิน
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate("/student/evaluations")}
                sx={{
                  bgcolor: "#e67e22",
                  color: "#ffffff",
                  borderRadius: "20px",
                  px: 2.5,
                  py: 1,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#d35400" },
                }}
              >
                เอกสารการประเมิน
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* ส่วนเอกสารการส่งตัว */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: BRAND_DARK, mb: 2, fontSize: "1.2rem" }}
        >
          เอกสารการส่งตัว
        </Typography>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #f1f5f9",
            overflow: "hidden",
            bgcolor: "#ffffff",
          }}
        >
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: "10%" }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569", width: "40%" }}>
                    เอกสาร
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: "15%" }}>
                    จำนวนฉบับ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: "20%" }}>
                    วันที่อัปโหลด
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: "15%" }}>
                    ดำเนินการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dispatchDocs.map((doc, idx) => (
                  <TableRow key={doc.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 600, color: "#334155" }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: "#e8f5e9",
                            color: "#005c47",
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                          }}
                        >
                          <DescriptionIcon sx={{ fontSize: 22 }} />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}
                          >
                            {doc.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}
                          >
                            {doc.subTitle}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: "#334155" }}>
                      {doc.count}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {doc.uploadDate}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          bgcolor: "#005c47",
                          color: "#ffffff",
                          borderRadius: "20px",
                          px: 2.5,
                          py: 0.5,
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          textTransform: "none",
                          boxShadow: "none",
                          "&:hover": { bgcolor: "#00423b" },
                        }}
                      >
                        ดาวน์โหลด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

export default DocumentScanDashboard3;