import * as gameHistoryService from "../services/game-history.service.js";

export const getSingleplayerHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await gameHistoryService.getSingleplayerHistoryForUser(userId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

export const getMultiplayerHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await gameHistoryService.getMultiplayerHistoryForUser(userId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};
