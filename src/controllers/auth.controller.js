import prisma from "../config/prisma.config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "../utils/create-error.util.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";

// Array ของรูปภาพโปรไฟล์เริ่มต้น
const defaultAvatars = [
  "https://www.svgrepo.com/show/420360/avatar-batman-comics.svg",
  "https://www.svgrepo.com/show/420329/anime-away-face.svg",
  "https://www.svgrepo.com/show/420350/christmas-clous-santa.svg",
  "https://www.svgrepo.com/show/420347/avatar-einstein-professor.svg",
];

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

    // 1. สุ่ม index จาก array defaultAvatars
    const randomIndex = Math.floor(Math.random() * defaultAvatars.length);
    // 2. ดึง URL รูปภาพที่สุ่มได้ออกมา
    const randomAvatarUrl = defaultAvatars[randomIndex];

    // สร้าง User ใหม่ (ไม่ต้องส่ง provider, Prisma จะใช้ default value เอง)
    const newUser = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: hashedPassword,
        image: randomAvatarUrl,
        // ไม่ต้องระบุ provider และ role ที่นี่ Prisma จะใช้ค่า default จาก schema
      },
    });

    // สร้าง WinRate record สำหรับ user ใหม่
    for (const diff of ["classic", "challenge"]) {
      await prisma.winRate.create({
        data: {
          userId: newUser.id,
          difficulty: diff,
        },
      });
    }

    res.status(201).json({ message: "User registered successfully." ,newUser});
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
    const { username } = req.body;

    // 1. สร้าง Object ว่างๆ เพื่อรอเก็บข้อมูลที่จะอัปเดต
    const dataToUpdate = {};

    // 2. ตรวจสอบว่ามีการส่ง username มาหรือไม่
    if (username) {
      dataToUpdate.username = username;
    }

    // 3. ตรวจสอบว่ามีการอัปโหลดไฟล์ใหม่หรือไม่ (Multer จะสร้าง req.file ให้)
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images", // จัดระเบียบไฟล์ใน Cloudinary
      });
      // นำ secure_url จาก Cloudinary มาใส่ใน object ที่จะอัปเดต
      dataToUpdate.image = result.secure_url;
      // ลบไฟล์ชั่วคราวออกจากเซิร์ฟเวอร์หลังอัปโหลดสำเร็จ
      await fs.unlink(req.file.path);
    }

    // 4. ตรวจสอบว่ามีข้อมูลอะไรให้อัปเดตหรือไม่
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: "No data provided for update." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: dataToUpdate,
      omit: { password: true },
    });

    res.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    if (req.file) {
      // ใช้ .catch เผื่อกรณีที่ไฟล์ไม่มีอยู่แล้ว
      await fs.unlink(req.file.path).catch((err) => {
        console.error("Error deleting temp file on failure:", err);
      });
    }
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

export const updateUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบว่า status ที่ส่งมาถูกต้องตาม enum หรือไม่
    const validStatuses = ["pending", "active", "banned"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        status,
      },
      omit: { password: true },
    });

    res.json({
      message: `User ${updatedUser.username} updated successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
