//Validate with yup
import { object,string,ref } from "yup";

export const registerSchema = object({
  email: string().email("Invalid Email").required("Please enter Email"),
  name:string().min(3, "Name must be more than 3 chars").required("Please enter your name"),
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