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
  {
    description: "Ban Rak Thai Village, Mae Hong Son",
    lat: 19.5113,
    lng: 97.9224,
  },
  {
    description: "Phu Ruea Viewpoint, Loei",
    lat: 17.4551,
    lng: 101.3511,
  },
  {
    description: "Tha Chalom Old Town, Samut Sakhon",
    lat: 13.5376,
    lng: 100.2732,
  },
  {
    description: "Yasothon City Pillar Shrine",
    lat: 15.7937,
    lng: 104.1448,
  },
  {
    description: "Uthai Thani Riverside Market",
    lat: 15.3855,
    lng: 100.0252,
  },
  {
    description: "Tha Sadet Market, Nakhon Phanom",
    lat: 17.4108,
    lng: 104.7787,
  },
  {
    description: "Ban Laem District, Phetchaburi",
    lat: 13.0972,
    lng: 99.9567,
  },
  {
    description: "Sangkhla Buri Local Area, Kanchanaburi",
    lat: 15.1461,
    lng: 98.4574,
  },
  {
    description: "Pak Chong Railway Station, Nakhon Ratchasima",
    lat: 14.7054,
    lng: 101.4158,
  },
  {
    description: "Downtown Trang (Clock Tower Circle)",
    lat: 7.5576,
    lng: 99.6116,
  },
  {
    description: "Ban Pong Market Road, Ratchaburi",
    lat: 13.8195,
    lng: 99.8782,
  },
  {
    description: "Downtown Phitsanulok near Railway Station",
    lat: 16.8211,
    lng: 100.2636,
  },
  {
    description: "Lamphun Old Town Main Road",
    lat: 18.5749,
    lng: 99.0086,
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
    where: { stripePriceId: "price_1RtPmYJvFVWyYIUhMzVZ00NY" }, // <-- Price ID ของ Basic Plan
    update: {}, // ไม่ต้องทำอะไรถ้าเจอ
    create: {
      name: SubscriptionTierName.basic, // ใช้ Enum ที่ import มา
      price: 119.0,
      stripePriceId: "price_1RtPmYJvFVWyYIUhMzVZ00NY",
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
