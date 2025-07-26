import prisma from "../config/prisma.config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "../utils/create-error.util.js";

export const registerUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // ตรวจสอบว่ามี email นี้ในระบบแล้วหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return createError(400, "This email is already in use.");
    }

    // เข้ารหัสผ่าน
    const hashedPassword = bcrypt.hashSync(password, 10);

    // สร้าง User ใหม่ (ไม่ต้องส่ง provider, Prisma จะใช้ default value เอง)
    const newUser = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: hashedPassword,
        // ไม่ต้องระบุ provider และ role ที่นี่ Prisma จะใช้ค่า default จาก schema
      },
    });
    
    // สร้าง WinRate record สำหรับ user ใหม่
    await prisma.winRate.create({
      data: {
        userId: newUser.id,
      }
    });


    res.status(201).json({ message: "User registered successfully." });

  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ค้นหา user ด้วย email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return createError(400, "Invalid email or password.");
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) {
      return createError(400, "Invalid email or password.");
    }

    // สร้าง Token
    const payload = {
      id: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "1d" });

    // ไม่ควรส่งข้อมูล user ทั้งหมดกลับไป
    const { password: pw, ...userInfo } = user;

    res.json({
      message: `Welcome back ${user.username || user.email}`,
      user: userInfo,
      token: token,
    });

  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    // id จาก token เป็น String อยู่แล้ว ไม่ต้องแปลงเป็น Number
    const { id } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: id },
      include: {
        winRate: true, // ดึงข้อมูล WinRate มาด้วย
        leaderboard: true,
      },
      omit: { password: true },
    });

    if (!user) {
      return createError(404, "User not found.");
    }

    res.json({ user: user });
  } catch (error) {
    next(error);
  }
};

export const listUser = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      omit: { password: true },
    });
    res.json({ users: users });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.user; // id จาก token
    const { email, username } = req.body; // รับแค่ email กับ username

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        email: email,
        username: username,
      },
      omit: { password: true },
    });

    res.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params; // รับ id จาก params
    await prisma.user.delete({
      where: { id: id },
    });
    res.status(204).send(); // ส่ง status 204 No Content เมื่อลบสำเร็จ
  } catch (error) {
    next(error);
  }
};