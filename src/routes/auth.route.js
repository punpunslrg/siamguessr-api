import express, { Router } from "express";
import passport from 'passport';

import { loginSchema,registerSchema, schemaVerifyOtp, validate } from "../validations/validator.js";
import authController, { registerUser,loginUser } from "../controllers/auth.controller.js";

const authRoute = express.Router();

// authRoute.post("/login", (req, res, next) => {
//   res.status(200).json({ mesaage: "login path" });
// });
// authRoute.post("/register", (req, res, next) => {
//   res.status(200).json({ mesaage: "register path" });
// });

authRoute.post('/register', validate(registerSchema), registerUser);
authRoute.post("/login", validate(loginSchema), loginUser);

// authRoute.get("/google", (req, res, next) => {
//   res.status(200).json({ mesaage: "google path" });
// });

// authRoute.get("/google/callback", (req, res, next) => {
//   res.status(200).json({ mesaage: "google callback path" });
// });
  
authRoute.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

authRoute.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google-failed`
  }),
  authController.socialLoginSuccess
);

// authRoute.get("/facebook", (req, res, next) => {
//   res.status(200).json({ mesaage: "facebook path" });
// });
// authRoute.get("/facebook/callback", (req, res, next) => {
//   res.status(200).json({ mesaage: "facebook callback path" });
// });

authRoute.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));


authRoute.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook-failed`
  }),
  authController.socialLoginSuccess
);

authRoute.post('/refresh', authController.refresh);
authRoute.post('/logout', authController.logout);

authRoute.post('/forgot-password', authController.forgotPassword);
authRoute.post('/verify-otp',validate(schemaVerifyOtp), authController.verifyOtp);
authRoute.post('/reset-password', authController.resetPassword);

export default authRoute;
