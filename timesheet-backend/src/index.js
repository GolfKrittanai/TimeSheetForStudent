require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');       // สำหรับ user/admin
const timesheetRoutes = require('./routes/timesheetRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Mount route โดยแยก path ชัดเจน
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);            // path สำหรับ user ทั้ง admin และ student
app.use('/api/timesheets', timesheetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
