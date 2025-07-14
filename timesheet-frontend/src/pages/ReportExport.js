import React, { useState } from "react";
import Navbar from "../components/Navbar";
import {
    Box,
    Button,
    TextField,
    Typography,
    Stack,
    Select,
    MenuItem,
} from "@mui/material";
import axios from "axios";

function ReportExport({ user }) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startStudentId, setStartStudentId] = useState("");
    const [endStudentId, setEndStudentId] = useState("");
    const [previewData, setPreviewData] = useState([]);
    const [format, setFormat] = useState("pdf");
    const [loading, setLoading] = useState(false);

    const isAdmin = user.role === "admin";

    const fetchPreview = async () => {
        if (!startDate || !endDate) {
            alert("กรุณาเลือกช่วงวันที่");
            return;
        }
        setLoading(true);
        try {
            let params = { startDate, endDate };
            if (isAdmin && startStudentId && endStudentId) {
                params.startStudentId = startStudentId;
                params.endStudentId = endStudentId;
            }
            const res = await axios.get("/api/reports/timesheets", { params });
            setPreviewData(res.data);
        } catch (err) {
            alert("โหลดตัวอย่างข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!startDate || !endDate) {
            alert("กรุณาเลือกช่วงวันที่");
            return;
        }
        setLoading(true);
        try {
            const body = {
                startDate,
                endDate,
                format,
            };
            if (isAdmin && startStudentId && endStudentId) {
                body.startStudentId = startStudentId;
                body.endStudentId = endStudentId;
            }

            const response = await axios.post("/api/reports/export", body, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], {
                type:
                    format === "pdf"
                        ? "application/pdf"
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = `timesheet_${startDate}_${endDate}.${format === "pdf" ? "pdf" : "xlsx"
                }`;
            link.click();
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการส่งออกไฟล์");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar /> {/* ✅ เพิ่ม navbar ด้านบน */}
            <Box p={3} maxWidth={600} margin="auto">
                <Typography variant="h6" mb={2}>
                    Export Timesheet Report
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="วันที่เริ่มต้น"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="วันที่สิ้นสุด"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    {isAdmin && (
                        <>
                            <TextField
                                label="รหัสนักศึกษา เริ่มต้น"
                                value={startStudentId}
                                onChange={(e) => setStartStudentId(e.target.value)}
                            />
                            <TextField
                                label="รหัสนักศึกษา สิ้นสุด"
                                value={endStudentId}
                                onChange={(e) => setEndStudentId(e.target.value)}
                            />
                        </>
                    )}

                    <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="excel">Excel</MenuItem>
                    </Select>

                    <Button variant="outlined" onClick={fetchPreview} disabled={loading}>
                        ดูตัวอย่างข้อมูล
                    </Button>

                    <Box
                        maxHeight={200}
                        overflow="auto"
                        border="1px solid #ccc"
                        p={1}
                        style={{ fontSize: "0.9rem" }}
                    >
                        {previewData.length === 0 && (
                            <Typography>ไม่มีข้อมูลแสดง</Typography>
                        )}
                        {previewData.map((item, i) => (
                            <Typography key={i}>
                                วันที่: {item.date.slice(0, 10)}, รหัส: {item.studentId}, ชั่วโมง:{" "}
                                {item.hours}, กิจกรรม: {item.activity}
                            </Typography>
                        ))}
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        Export
                    </Button>
                </Stack>
            </Box>
        </>
    );
}

export default ReportExport;
