import express from "express";
import * as guessController from "../controllers/guess.controller.js"
import { authCheck } from "../middlewares/auth.middleware.js";

const guessRoute = express.Router()

guessRoute.post("/",authCheck, guessController.submitGuess)

export default guessRoute
