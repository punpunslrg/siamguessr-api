//Validate with yup
import { object,string,ref } from "yup";

export const registerSchema = object({
  email: string().email("Invalid Email").required("Please enter Email"),
  username:string().min(3, "Name must be more than 3 chars").required("Please enter your name"),
  password:string().min(6, "Password must be more than 6 chars").required("Please enter a password"),
  confirmPassword:string().oneOf([ref("password"), null], "Invalid password").required("Please confirm your password"),
})

export const loginSchema = object({
  email: string().email("Invalid Email").required("Please enter Email"),
  password:string().min(6, "Password must be more than 6 chars").required("Please enter a password"),
})

export const validate = (schema) => async (req,res,next) => {
  try {
    // console.log("This is validate",req.body);
    await schema.validate(req.body,{abortEarly: false});
    next();
  } catch (error) {
    const errMsg = error.errors.map((item)=>item)
    const errTxt = errMsg.join(", ")
    console.log("errortext",errTxt)
    const mergeErr = new Error(errTxt)
    next(mergeErr);
  }
}

export const schemaForgotPassword = Yup.object({
  email:
    Yup.string()
      .email("Email is invalid")
      .max(30, "Email must be at most 30 characters")
      .required("Email is required")
}).noUnknown()

export const schemaVerifyOtp = Yup.object({
  email:
    Yup.string()
      .email("Email is invalid")
      .required("Email is required"),
  otp:
    Yup.string()
      .matches(/^[0-9]{4}$/, "OTP must be exactly 4 digits")
      .required("OTP is required")
}).noUnknown()

export const schemaResetPassword = Yup.object({
  newPassword:
    Yup.string()
      .max(30, "Password must be at most 30 characters")
      .matches(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/,
        "Password must be at least 8 characters and include uppercase, lowercase, and a number")
      .required("Password is required"),
  confirmNewPassword:
    Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required")
}).noUnknown()

export const schemaChangePassword = Yup.object({
  currentPassword:
    Yup.string()
      .max(30, "Password must be at most 30 characters")
      .required('Please enter current password.'),
  newPassword:
    Yup.string()
      .max(30, "Password must be at most 30 characters")
      .matches(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/,
        "Password must be at least 8 characters and include uppercase, lowercase, and a number")
      .required("Password is required"),
  confirmNewPassword:
    Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required")
}).noUnknown(true)