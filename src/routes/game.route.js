import express from "express";
import * as mapController from "../controllers/map/map.controller.js";
import * as gameHistoryController from "../controllers/game-history.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";

const gameRoute = express.Router();

gameRoute.get("/random-location", mapController.randomLocation);

gameRoute.get("/game-history/singleplayer", authCheck, gameHistoryController.getSingleplayerHistory);

gameRoute.get("/game-history/multiplayer", authCheck, gameHistoryController.getMultiplayerHistory);

export default gameRoute;
