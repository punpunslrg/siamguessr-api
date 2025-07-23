import express from "express";

const friendRoute = express.Router();

// 	Gets a list of the current user's friends (status: 'accepted').
friendRoute.get("/", (req, res, next) => {
  res.status(200).json({ mesaage: "friend path" });
});

// Gets pending incoming friend requests.
friendRoute.get("/requests", (req, res, next) => {
  res.status(200).json({ mesaage: "pending friend request path" });
});

// Sends a friend request to another user by their ID.
friendRoute.post("/requests", (req, res, next) => {
  res.status(200).json({ mesaage: "send request path" });
});

// Accepts or declines a friend request from a specific user.
friendRoute.post("/requests/:userId", (req, res, next) => {
  res.status(200).json({ mesaage: "accept decline path" });
});

// Removes a friend.
friendRoute.delete("/:userId", (req, res, next) => {
  res.status(200).json({ mesaage: "remove friend path" });
});

export default friendRoute;
