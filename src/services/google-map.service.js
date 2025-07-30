// You no longer need the THAILAND_BOUNDS
// const THAILAND_BOUNDS = { ... };

// 1. Create your curated list of high-quality, verified locations.
// This should eventually be in a database, but an array is fine for now.
const curatedLocations = [
  { "name": "Victory Monument, Bangkok", "lat": 13.7651, "lng": 100.5386 },
  { "name": "Siam Paragon, Bangkok", "lat": 13.7462, "lng": 100.5348 },
  { "name": "Wat Phra That Doi Suthep, Chiang Mai", "lat": 18.8044, "lng": 98.9208 },
  { "name": "Ayutthaya Historical Park", "lat": 14.3567, "lng": 100.5684 },
  { "name": "Patong Beach, Phuket", "lat": 7.8973, "lng": 98.2965 },
  { "name": "The White Temple, Chiang Rai", "lat": 19.8245, "lng": 99.7628 },
  // ...add hundreds or thousands more locations here
];

export async function findRandomLocation() {
  // 2. Select a random location directly from your curated list.
  const randomIndex = Math.floor(Math.random() * curatedLocations.length);
  const randomLocation = curatedLocations[randomIndex];

  console.log(`Serving curated location: ${randomLocation.name}`);

  // 3. Return the location. It's guaranteed to be valid.
  // No API calls, no loops, no errors.
  return {
    name: randomLocation.name,
    lat: randomLocation.lat,
    lng: randomLocation.lng,
  };
}