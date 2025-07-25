import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findRandomLocation } from './google-map.service.js';

// --- Function to get a location from the mock file ---
function getMockLocation() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const mockLocationsPath = path.join(__dirname, '../mock/mockLocations.json');
  
  const mockLocations = JSON.parse(fs.readFileSync(mockLocationsPath, 'utf-8'));
  const randomIndex = Math.floor(Math.random() * mockLocations.length);
  
  console.log('Using MOCK location:', mockLocations[randomIndex].name);
  return mockLocations[randomIndex];
}

// --- This is the main function your controller will use ---
export async function getRandomLocation() {
  // Use mock data if in development mode, otherwise call the real API
  if (process.env.NODE_ENV === 'development') {
    return getMockLocation();
  } else {
    return findRandomLocation();
  }
}