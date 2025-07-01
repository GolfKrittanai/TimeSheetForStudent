# TimeSheetForStudent

# 📘 TimeSheetForStudent (Frontend)

ระบบบันทึกเวลาสำหรับนักศึกษาและแอดมิน  
พัฒนาโดย React + Material UI + Formik + Context API + Axios

---

## 📦 เทคโนโลยีที่ใช้

- React.js
- React Router DOM
- Material UI
- Formik + Yup
- Axios
- Context API
- JWT Authentication

---

## 📁 โครงสร้างโปรเจกต์

```bash
TimeSheetForStudent/
├── public/
├── src/
│   ├── components/         # Navbar, UI ส่วนกลาง
│   ├── context/            # AuthContext (จัดการ login/logout)
│   ├── pages/              # Login, Register, Dashboards
│   ├── services/           # axios API services
│   ├── App.js              # Routing
│   └── index.js
├── .env                    # ตัวแปร API URL
├── package.json

## ⚙️ วิธีติดตั้งและใช้งาน
git clone https://github.com/your-username/TimeSheetForStudent.git
cd TimeSheetForStudent
npm install

## 🔧 ตั้งค่า .env
REACT_APP_API=http://localhost:5000/api

## ▶️ เริ่มรันโปรเจกต์
npm start

