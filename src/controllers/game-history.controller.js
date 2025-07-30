import * as gameHistoryService from "../services/game-history.service.js";
import createError from "../utils/create-error.util.js";

export const getSingleplayerHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await gameHistoryService.getSingleplayerHistory(userId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

export const getMultiplayerHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await gameHistoryService.getMultiplayerHistory(userId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};
