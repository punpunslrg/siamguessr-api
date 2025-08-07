import jwt from "jsonwebtoken";
import createError from "../utils/create-error.util.js";

export const authCheck = (req, res, next) => {
  //code body
  try {
    const header = req.headers.authorization;
    // console.log(header)
    if (!header) {
      createError(401, "Token is missing!!!");
    }

    //2. Split token
    const token = header.split(" ")[1];
    // console.log(token);

    //3. Verify Token
    console.log(req.body)
    jwt.verify(token, process.env.JWT_SECRET, (error, decode) => {
      // console.log(error)
      // console.log("Decoded token:", decode);
      if (error) {
        createError(401, "Token is Invalid!!!");
      }

      req.user = decode;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(createError(403, 'Forbidden: Admin access required.'));
  }
};