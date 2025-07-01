import jwt from 'jsonwebtoken'

export const generateToken = (user) => {
return jwt.sign(
{
id: user.id,
studentId: user.studentId,
role: user.role,
name: user.name
},
process.env.JWT_SECRET,
{ expiresIn: '7d' }
)
}