import express from "express";
import * as roundController from "../controllers/round.controller.js"
import { authCheck } from "../middlewares/auth.middleware.js";

const roundRoute = express.Router()

roundRoute.get("/:roundId/result", roundController.getRoundResult);
roundRoute.post("/start",authCheck ,roundController.startNextRound);

export default roundRoute