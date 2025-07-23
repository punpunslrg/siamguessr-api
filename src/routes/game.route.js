import express from "express";
import * as mapController from "../controllers/map/map.controller.js"

const gameRoute = express.Router();

gameRoute.get("/random-location", mapController.randomLocation);

export default gameRoute;
