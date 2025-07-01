import bcrypt from 'bcryptjs'
import prisma from '../prisma/client.js'
import { generateToken } from '../utils/generateToken.js'

export const register = async (req, res) => {
try {
const { studentId, name, password } = req.body
} catch (err) {
res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message })
}
}

export const login = async (req, res) => {
try {
const { studentId, password } = req.body
} catch (err) {
res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message })
}
}