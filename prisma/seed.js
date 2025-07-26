import prisma from "../src/config/prisma.config.js";

// The location data you provided
const locationsData = [
  {
    "name": "Democracy Monument, Bangkok",
    "lat": 13.7569,
    "lng": 100.5025
  },
  {
    "name": "Pattaya Beach Road, Chonburi",
    "lat": 12.9373,
    "lng": 100.8845
  },
  {
    "name": "Bridge on the River Kwai, Kanchanaburi",
    "lat": 14.0428,
    "lng": 99.5037
  },
  {
    "name": "Three Kings Monument, Chiang Mai",
    "lat": 18.7909,
    "lng": 98.9873
  },
  {
    "name": "Big Buddha (Road Approach), Phuket",
    "lat": 7.8286,
    "lng": 98.3121
  },
  {
    "name": "Sanctuary of Truth (Road), Pattaya",
    "lat": 12.9723,
    "lng": 100.8888
  },
  {
    "name": "Hua Hin Railway Station, Prachuap Khiri Khan",
    "lat": 12.5684,
    "lng": 99.955
  },
  {
    "name": "Clock Tower, Chiang Rai",
    "lat": 19.9073,
    "lng": 99.8306
  },
  {
    "name": "Yaowarat Road (Chinatown Gate), Bangkok",
    "lat": 13.7388,
    "lng": 100.5117
  },
  {
    "name": "Doi Inthanon National Park (Summit Road), Chiang Mai",
    "lat": 18.5529,
    "lng": 98.4816
  },
  {
    "name": "Wat Pho (Reclining Buddha), Bangkok",
    "lat": 13.747,
    "lng": 100.492
  },
  {
    "name": "Historic City of Ayutthaya (Wat Phra Si Sanphet)",
    "lat": 14.3562,
    "lng": 100.5593
  },
  {
    "name": "Golden Triangle Park, Chiang Rai",
    "lat": 20.352,
    "lng": 100.0805
  }
];

async function main() {
  console.log(`Start seeding ...`);

  // Format the data to match the Prisma schema
  const formattedLocations = locationsData.map(location => ({
    lat: location.lat,
    lng: location.lng,
    description: location.name,
    countryCode: 'TH', 
    isVerified: true,
  }));

  // Use createMany for efficient bulk insertion
  const result = await prisma.curatedLocation.createMany({
    data: formattedLocations,
    skipDuplicates: true, // Optional: useful if you run the seed multiple times
  });

  console.log(`Seeding finished. Added ${result.count} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });