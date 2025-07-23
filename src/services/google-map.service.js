import axios from "axios";
import createError from "../utils/create-error.util.js";

const THAILAND_BOUNDS = {
  south: 5.6,
  west: 97.3,
  north: 20.5,
  east: 105.6,
};

export async function findRandomLocationFromGoogle() {
  const MAX_ATTEMPTS = 20;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      // 1. Generate random coordinates within Thailand
      const lat =
        Math.random() * (THAILAND_BOUNDS.north - THAILAND_BOUNDS.south) +
        THAILAND_BOUNDS.south;
      const lng =
        Math.random() * (THAILAND_BOUNDS.east - THAILAND_BOUNDS.west) +
        THAILAND_BOUNDS.west;

      // 2. Call the Google Street View API's metadata endpoint
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/streetview/metadata",
        {
          params: {
            location: `${lat},${lng}`,
            key: process.env.Maps_API_KEY,
            source: "outdoor",
          },
        }
      );

      // 3. Check if the API returned a valid location
      if (response.data.status === "OK") {
        console.log(`Attempt ${i + 1}: Found valid location!`);
        return {
          lat: response.data.location.lat,
          lng: response.data.location.lng,
        };
      }
    } catch (error) {
      console.error(
        "Error fetching Street View metadata:",
        error.response.data.error_message
      );
    }
  }

  // If no location is found after all attempts
  // throw new Error(
  //   "Could not find a valid Street View location in Thailand after multiple attempts."
  // );

  createError(400, "Could not find a valid Street View location in Thailand after multiple attempts.")
}
