import prisma, { SubscriptionTierName } from "../src/config/prisma.config.js";

// The location data you provided
const locationsData = [
  {
    description: "Democracy Monument, Bangkok",
    lat: 13.7569,
    lng: 100.5025,
  },
  {
    description: "Golden Triangle Park, Chiang Rai",
    lat: 20.352,
    lng: 100.0805,
  },
  {
    description: "Bridge on the River Kwai, Kanchanaburi",
    lat: 14.0428,
    lng: 99.5037,
  },
  {
    description: "Three Kings Monument, Chiang Mai",
    lat: 18.7909,
    lng: 98.9873,
  },
  {
    description: "Big Buddha (Road Approach), Phuket",
    lat: 7.8286,
    lng: 98.3121,
  },
];

async function main() {
  console.log(`Start seeding ...`);

  // Format the data to match the Prisma schema
  const formattedLocations = locationsData.map((location) => ({
    lat: location.lat,
    lng: location.lng,
    description: location.description,
    countryCode: "TH",
    isVerified: true,
  }));

  // Use createMany for efficient bulk insertion
  const result = await prisma.curatedLocation.createMany({
    data: formattedLocations,
    skipDuplicates: true, // Optional: useful if you run the seed multiple times
  });

  console.log(`Seeding finished. Added ${result.count} locations.`);

  console.log("Seeding subscription tiers...");
  // ใช้ .upsert เพื่อป้องกันการสร้างข้อมูลซ้ำ
  // มันจะหาด้วย stripePriceId, ถ้าเจอจะไม่อัปเดต, ถ้าไม่เจอจะสร้างใหม่
  const basicTier = await prisma.subscriptionTier.upsert({
    where: { stripePriceId: "price_1RrDvkGrzg3Hq6W5zImzX34N" }, // <-- Price ID ของ Basic Plan
    update: {}, // ไม่ต้องทำอะไรถ้าเจอ
    create: {
      name: SubscriptionTierName.basic, // ใช้ Enum ที่ import มา
      price: 119.0,
      stripePriceId: "price_1RrDvkGrzg3Hq6W5zImzX34N",
      description: "Basic Monthly Plan",
    },
  });
  console.log(`Upserted 'basic' tier:`, basicTier);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
