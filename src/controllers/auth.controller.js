import prisma from "../config/prisma.config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "../utils/create-error.util.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs/promises";
import authService from "../services/auth.service.js";
import jwtService from "../services/jwt.service.js";
import hashService from "../services/hash.service.js";
import { OAuth2Client } from "google-auth-library";

// Array ของรูปภาพโปรไฟล์เริ่มต้น
const defaultAvatars = [
  "https://www.svgrepo.com/show/420360/avatar-batman-comics.svg",
  "https://www.svgrepo.com/show/420329/anime-away-face.svg",
  "https://www.svgrepo.com/show/420350/christmas-clous-santa.svg",
  "https://www.svgrepo.com/show/420347/avatar-einstein-professor.svg",
];

const authController = {};

export const registerUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // ตรวจสอบว่ามี email นี้ในระบบแล้วหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      createError(400, "This email is already in use.");
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

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    console.log('Login attempt:', { email, userFound: !!user, hasPassword: !!user?.password, provider: user?.provider });

    if (!user) {
     throw createError(400, "Invalid email or password.");
    }

    if (!user.password) {
     throw createError(400, "This account was created with social login. Please use Google/Facebook to sign in.");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
     throw createError(400, "Invalid email or password.");
    }

    const accessToken = jwtService.genAccessToken({ id: user.id, role: user.role });
    const refreshToken = jwtService.genRefreshToken(user.id);

    await prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      }
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password: pw, ...userInfo } = user;

    res.json({
      message: `Welcome back ${user.username || user.email}`,
      user: userInfo,
      accessToken: accessToken,
      // csrfToken: req.csrfToken()
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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


authController.socialLoginSuccess = async (req, res, next) => {
  try {
    
    const user = req.user;

    
    const accessToken = jwtService.genAccessToken({ id: user.id, role: user.role });
    const refreshToken = jwtService.genRefreshToken(user.id);

    await prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      }
    });

    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // res.json({user:"user"})
    const redi = `${process.env.FRONTEND_URL}?token=${accessToken}`
    console.log('redi', redi)
    res.redirect(`${process.env.FRONTEND_URL}?token=${accessToken}`);
    // res.redirect(`${process.env.FRONTEND_URL}`);
  } catch (err) {
    
    const errorMessage = encodeURIComponent(err.message || 'An unknown error occurred during social login.');
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorMessage}`);
  }
};


authController.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw createError(400, "Email is required.");

    await authService.requestPasswordReset(email);

    res.status(200).json({ message: "OTP has been sent to your email." });
  } catch (err) {
    next(err);
  }
};

authController.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw createError(400, "Email and OTP are required.");
    }
    if (otp.length !== 4) {
      throw createError(400, "OTP must be 4 digits.")
    }

    const resetToken = await authService.verifyOtp(email, otp);

    res.status(200).json({
      message: "OTP verified successfully. You can now reset your password.",
      resetToken: resetToken // This token is sent to the client
    });
  } catch (err) {
    next(err);
  }
};

authController.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      throw createError(400, "Token and new password are required.");

    await authService.resetPasswordWithToken(token, newPassword);

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    next(err);
  }
};

authController.refresh = async (req, res, next) => {
  try {
    console.log('req.cookies.refreshToken', req.cookies.refreshToken)
    const oldRefreshToken = req.cookies.refreshToken;
    console.log('oldRefreshToken===================', oldRefreshToken)
    if (!oldRefreshToken) {
      throw createError(401, 'Authentication required.');
    }


    const oldRefresh = await prisma.refreshToken.findFirst({
      where: {
        token: oldRefreshToken
      },
      select: {
        userId: true,
        expiresAt: true
      }
    });
    console.log('oldRefresh', oldRefresh)

    if (!oldRefresh) {
      throw createError(401, 'Invalid token');
    }

    if (new Date() > oldRefresh.expiresAt) {
      throw createError(401, 'Token has not expired yet.');
    }

    const userId = oldRefresh.userId;
    console.log('userId', userId)

    const newAccessToken = jwtService.genAccessToken({ id: userId });
    console.log('newAccessToken', newAccessToken)

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });


  } catch (err) {
    next(err);
  }
};

authController.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }
    
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};


export const logout = authController.logout;
export default authController;
