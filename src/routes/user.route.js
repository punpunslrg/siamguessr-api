import express from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import { deleteUser, getMe, listUser, updateUser } from "../controllers/auth.controller.js";

const userRoute = express.Router();

userRoute.get("/me", (req, res, next) => {
  res.status(200).json({ mesaage: "get me path" });
});
userRoute.post("/me", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});

userRoute.get('/user',authCheck,listUser);

userRoute.get("/getme",authCheck,getMe)

userRoute.patch('/user/update/:id',authCheck,updateUser)

userRoute.delete("/user/delete/:id",authCheck,deleteUser)



export default userRoute;
