import { getRandomLocation } from "../../services/location.service.js";

export async function randomLocation(req, res, next) {
  try {
    // Call the one function to rule them all
    const location = await getRandomLocation();
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}