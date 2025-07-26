import prisma from "../config/prisma.config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "../utils/create-error.util.js";

export const registerUser = async (req, res, next) => {
  try {
    //1. check body

    console.log(req.body);
    const { email, name, password, provider, role } = req.body;

    // Step 2 Check username in DB
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        name: name,
      },
    });

    console.log(user);

    if (user) {
      createError(400, "Email already exist!!!");
    }

    // Step 3 Encrypt Password
    const hashPassword = bcrypt.hashSync(password, 10);
    console.log(hashPassword);

    // Step 4 Save to DB

    const result = await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashPassword,
        provider: provider,
        role: role,
      },
    });

    res.json({ message: `Register User Successfully` });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    //Step 2 Check body

    const { name, email, password } = req.body;

    //Step 3 Check Username

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    console.log(user);
    if (!user) {
      createError(400, "Email or Password is Invalid!!!");
    }

    // Step 4 Check password

    const checkPassword = bcrypt.compareSync(password, user.password);

    if (!checkPassword) {
      createError(400, "Email or Password is Invalid!!!");
    }

    //Step 5 Generate Token
    const payload = {
      id: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "1d" });

    res.json({
      message: `Welcome back ${user.name}`,
      name: name,
      payload: payload,
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const { id } = req.user;
    // console.log(id);

    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
      omit: {
        password: true,
      },
    });
    res.json({ result: user });
  } catch (error) {
    next(error);
  }
};

export const listUser = async (req, res, next) => {
  //code body
  try {
    //1. Check Email
    console.log(req.user);
    const user = await prisma.user.findMany({
      omit: {
        password: true,
      },
    });
    console.log(user);
    res.json({ message: "This is List All User", result: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    //1. Read params & body
    const { id } = req.user;
    const { email, name, password } = req.body;
    console.log(id, name, password);
    const usernameCheck = await prisma.user.findFirst({
      where: {
        email: email,
        name: name,
      },
    });
    if (usernameCheck) {
      createError(400, "Username Already Exist!!");
    }
    const hashPassword = bcrypt.hashSync(password, 10);
    //2. Update to DB
    const update = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        email: email,
        name: name,
        password: hashPassword,
      },
      omit: {
        password: true,
      },
    });

    res.json({
      message: `Update User Successfully`,
      update,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.delete({
      where: {
        id: Number(id),
      },
    });
    res.json({ message: "Delete Success!!!" });
  } catch (error) {
    next(error);
  }
};
