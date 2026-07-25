import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Service from "../src/models/Service.js";
import User from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TITLE_THEME_PATTERNS = [
  { theme: "venue", pattern: /(hall|venue|ballroom|banquet|reception)/i },
  { theme: "catering", pattern: /(cater|food|menu|buffet|chef|banquet)/i },
  { theme: "photography", pattern: /(photo|photograph|camera|portrait|gallery)/i },
  { theme: "videography", pattern: /(video|film|cinematic|drone|reel)/i },
  { theme: "entertainment", pattern: /(dj|sound|music|lighting|performance)/i },
  { theme: "beauty", pattern: /(makeup|salon|beauty|hair|bridal)/i },
  { theme: "decor", pattern: /(decor|styling|design|theme|backdrop)/i },
  { theme: "floral", pattern: /(floral|flower|bouquet|arrangement)/i },
  { theme: "planning", pattern: /(plan|coordination|event management|management)/i },
];

const THEME_PROFILES = {
  venue: [
    {
      vendorCategory: "Wedding Halls",
      businessName: "Royal Crown Banquets",
      ownerName: "Adeel Rafiq",
      city: "Lahore",
      country: "Pakistan",
      address: "Garden Town, Lahore",
      description: "Premium banquet spaces with polished hospitality and full event coordination.",
      profileImage:
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80",
      rating: 4.8,
      yearsOfExperience: 11,
    },
    {
      vendorCategory: "Wedding Halls",
      businessName: "Grand Atrium Events",
      ownerName: "Hassan Malik",
      city: "Karachi",
      country: "Pakistan",
      address: "Clifton, Karachi",
      description: "Elegant indoor venues for weddings, receptions, and corporate celebrations.",
      profileImage:
        "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
      rating: 4.7,
      yearsOfExperience: 9,
    },
  ],
  catering: [
    {
      vendorCategory: "Catering",
      businessName: "Saffron Spoon Catering",
      ownerName: "Hina Shah",
      city: "Karachi",
      country: "Pakistan",
      address: "Clifton, Karachi",
      description: "Buffet spreads, live stations, desserts, and curated beverage service.",
      profileImage:
        "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=80",
      rating: 4.7,
      yearsOfExperience: 8,
    },
    {
      vendorCategory: "Catering",
      businessName: "TasteCraft Kitchens",
      ownerName: "Bilal Qureshi",
      city: "Lahore",
      country: "Pakistan",
      address: "DHA, Lahore",
      description: "Premium catering teams for weddings, private dinners, and corporate dining.",
      profileImage:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
      rating: 4.6,
      yearsOfExperience: 10,
    },
  ],
  photography: [
    {
      vendorCategory: "Photography",
      businessName: "LensCraft Studio",
      ownerName: "Usman Javed",
      city: "Islamabad",
      country: "Pakistan",
      address: "F-7, Islamabad",
      description: "Candid storytelling, editorial portraits, and polished wedding albums.",
      profileImage:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=1600&q=80",
      rating: 4.9,
      yearsOfExperience: 12,
    },
    {
      vendorCategory: "Photography",
      businessName: "Frame & Focus Co.",
      ownerName: "Maha Ali",
      city: "Karachi",
      country: "Pakistan",
      address: "PECHS, Karachi",
      description: "Event-day coverage with quick gallery delivery and premium retouching.",
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80",
      rating: 4.8,
      yearsOfExperience: 7,
    },
  ],
  videography: [
    {
      vendorCategory: "Videography",
      businessName: "FrameMotion Films",
      ownerName: "Hamza Riaz",
      city: "Karachi",
      country: "Pakistan",
      address: "PECHS, Karachi",
      description: "Cinematic edits, drone shots, and full event coverage for premium celebrations.",
      profileImage:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80",
      rating: 4.8,
      yearsOfExperience: 9,
    },
    {
      vendorCategory: "Videography",
      businessName: "MotionHaven Studios",
      ownerName: "Saad Khan",
      city: "Lahore",
      country: "Pakistan",
      address: "Johar Town, Lahore",
      description: "Story-driven films, teaser cuts, and social-first highlight reels.",
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
      rating: 4.7,
      yearsOfExperience: 6,
    },
  ],
  entertainment: [
    {
      vendorCategory: "DJ & Sound",
      businessName: "Rhythm Rush DJs",
      ownerName: "Bilal Qureshi",
      city: "Lahore",
      country: "Pakistan",
      address: "DHA, Lahore",
      description: "DJ sets, uplighting, MC support, and sound systems for lively receptions.",
      profileImage:
        "https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
      rating: 4.6,
      yearsOfExperience: 7,
    },
    {
      vendorCategory: "DJ & Sound",
      businessName: "PulseWave Audio",
      ownerName: "Zayan Ahmed",
      city: "Islamabad",
      country: "Pakistan",
      address: "Blue Area, Islamabad",
      description: "Lighting rigs, wireless mics, and professional audio setups for events.",
      profileImage:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
      rating: 4.5,
      yearsOfExperience: 8,
    },
  ],
  beauty: [
    {
      vendorCategory: "Salon & Makeup",
      businessName: "GlamRoom Bridal Studio",
      ownerName: "Sara Nadeem",
      city: "Karachi",
      country: "Pakistan",
      address: "Bahadurabad, Karachi",
      description: "Soft glam, bridal styling, and long-wear makeup for event days.",
      profileImage:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80",
      rating: 4.8,
      yearsOfExperience: 10,
    },
    {
      vendorCategory: "Salon & Makeup",
      businessName: "Noor Beauty Atelier",
      ownerName: "Areeba Khan",
      city: "Lahore",
      country: "Pakistan",
      address: "Model Town, Lahore",
      description: "Pre-wedding grooming, bridal makeup, and hairstyling for all occasions.",
      profileImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
      rating: 4.7,
      yearsOfExperience: 9,
    },
  ],
  decor: [
    {
      vendorCategory: "Decor & Styling",
      businessName: "Bloom & Ribbon Decor",
      ownerName: "Daniyal Amin",
      city: "Islamabad",
      country: "Pakistan",
      address: "G-11, Islamabad",
      description: "Custom stage backdrops, floral walls, and venue styling packages.",
      profileImage:
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80",
      rating: 4.7,
      yearsOfExperience: 8,
    },
    {
      vendorCategory: "Decor & Styling",
      businessName: "Velvet Aura Designs",
      ownerName: "Farah Siddiqui",
      city: "Karachi",
      country: "Pakistan",
      address: "Clifton, Karachi",
      description: "Premium floral installs, stage themes, and entrance styling.",
      profileImage:
        "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=1600&q=80",
      rating: 4.8,
      yearsOfExperience: 11,
    },
  ],
  floral: [
    {
      vendorCategory: "Floral Arrangements",
      businessName: "Petal Story Florals",
      ownerName: "Mahnoor Ali",
      city: "Lahore",
      country: "Pakistan",
      address: "Johar Town, Lahore",
      description: "Fresh floral arches, bouquet design, and aisle arrangements.",
      profileImage:
        "https://images.unsplash.com/photo-1469259943454-aa100abba749?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7?auto=format&fit=crop&w=1600&q=80",
      rating: 4.9,
      yearsOfExperience: 6,
    },
    {
      vendorCategory: "Floral Arrangements",
      businessName: "Roseframe Botanics",
      ownerName: "Nida Ahmed",
      city: "Islamabad",
      country: "Pakistan",
      address: "F-6, Islamabad",
      description: "Elegant floral styling for stages, tables, entrances, and bridal setups.",
      profileImage:
        "https://images.unsplash.com/photo-1516749830595-ec7857fe18f9?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80",
      rating: 4.8,
      yearsOfExperience: 7,
    },
  ],
  planning: [
    {
      vendorCategory: "Event Planning",
      businessName: "EventNest Planning",
      ownerName: "Nabeel Khalid",
      city: "Multan",
      country: "Pakistan",
      address: "Cantt, Multan",
      description: "Full-service coordination, guest flow planning, and vendor management.",
      profileImage:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
      rating: 4.4,
      yearsOfExperience: 5,
    },
    {
      vendorCategory: "Event Planning",
      businessName: "Summit Day Planners",
      ownerName: "Tania Farhat",
      city: "Lahore",
      country: "Pakistan",
      address: "Gulberg, Lahore",
      description: "Wedding timelines, venue sourcing, and day-of logistics support.",
      profileImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80",
      rating: 4.5,
      yearsOfExperience: 9,
    },
  ],
  general: [
    {
      vendorCategory: "Event Services",
      businessName: "EventOrbit Pro Services",
      ownerName: "Imran Saeed",
      city: "Islamabad",
      country: "Pakistan",
      address: "Blue Area, Islamabad",
      description: "Reliable event support with polished delivery and responsive coordination.",
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80",
      rating: 4.5,
      yearsOfExperience: 6,
    },
    {
      vendorCategory: "Event Services",
      businessName: "Premium Occasion Co.",
      ownerName: "Hira Aslam",
      city: "Karachi",
      country: "Pakistan",
      address: "DHA Phase 5, Karachi",
      description: "Flexible service packages for modern events and private functions.",
      profileImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      coverImage:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
      rating: 4.4,
      yearsOfExperience: 5,
    },
  ],
};

const lower = (value) => String(value ?? "").trim().toLowerCase();

const slugify = (value) =>
  lower(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const hashString = (value) => {
  const text = String(value ?? "");
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
};

const detectTheme = (service) => {
  const haystack = `${service.title || ""} ${service.description || ""}`;
  const found = TITLE_THEME_PATTERNS.find(({ pattern }) => pattern.test(haystack));
  return found?.theme || "general";
};

const getServiceCity = (service) => {
  const rawLocation = String(service.location || "").trim();
  if (!rawLocation) return "Pakistan";

  const parts = rawLocation.split(",");
  return parts[0].trim() || rawLocation;
};

const buildEmail = (service, slot, profile) => {
  const base = slugify(`${profile.businessName}-${service.title}-${service._id}-${slot}`);
  return `${base}@eventorbit.local`;
};

const buildPhoneNumber = (service, slot, profile) => {
  const seed = hashString(`${service._id}:${slot}:${profile.businessName}`) % 10_000_000;
  const sevenDigits = String(seed).padStart(7, "0");
  const operator = slot === 1 ? "300" : "321";
  return `+92 ${operator} ${sevenDigits.slice(0, 3)} ${sevenDigits.slice(3)}`;
};

const buildBusinessName = (service, slot, profile) => {
  const city = getServiceCity(service);
  const prefix = slot === 1 ? "Prime" : "Elite";
  const themeLabel = profile.vendorCategory || "Event Services";
  return `${prefix} ${themeLabel} ${city}`;
};

const buildOwnerName = (service, slot, profile) => {
  if (slot === 1) return profile.ownerName;

  const fallbackOwners = [
    "Amina Khan",
    "Omar Farooq",
    "Hira Malik",
    "Saad Ahmed",
    "Maham Shah",
    "Daniyal Iqbal",
  ];

  return fallbackOwners[hashString(`${service._id}:${profile.businessName}`) % fallbackOwners.length];
};

const buildVendorDoc = (service, slot, profile) => {
  const createdAt = addDays(service.createdAt || new Date(), slot === 1 ? 24 : 16);
  const updatedAt = createdAt;
  const city = profile.city || getServiceCity(service);
  const businessName = buildBusinessName(service, slot, profile);
  const email = buildEmail(service, slot, profile);

  return {
    firstName: buildOwnerName(service, slot, profile).split(" ")[0],
    lastName: buildOwnerName(service, slot, profile).split(" ").slice(1).join(" ") || "Vendor",
    email,
    password: "Vendor@12345",
    profileImage: profile.profileImage,
    coverImage: profile.coverImage,
    location: `${city}, ${profile.country || "Pakistan"}`,
    city,
    country: profile.country || "Pakistan",
    phoneNumber: buildPhoneNumber(service, slot, profile),
    address: profile.address,
    role: "vendor",
    isApproved: true,
    businessName,
    businessDescription: profile.description,
    vendorBio: profile.description,
    whatsappNumber: buildPhoneNumber(service, slot, profile),
    instagram: `https://instagram.com/${slugify(businessName)}`,
    linkedin: `https://linkedin.com/company/${slugify(businessName)}`,
    facebook: `https://facebook.com/${slugify(businessName)}`,
    website: `https://${slugify(businessName)}.eventorbit.local`,
    vendorCategory: profile.vendorCategory,
    vendorStatus: "Approved",
    status: "Active",
    vendorRating: profile.rating,
    vendorBookings: 0,
    vendorRevenue: 0,
    yearsOfExperience: profile.yearsOfExperience,
    serviceIds: [service._id],
    createdAt,
    updatedAt,
  };
};

const ensureVendor = async (service, slot, profile) => {
  const email = buildEmail(service, slot, profile);
  const phoneNumber = buildPhoneNumber(service, slot, profile);

  const existing = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $addToSet: { serviceIds: service._id },
        $set: {
          role: "vendor",
          isApproved: true,
          vendorStatus: "Approved",
          status: existing.status || "Active",
        },
      },
    );

    return { vendor: existing, created: false };
  }

  const vendorDoc = buildVendorDoc(service, slot, profile);
  const createdVendor = await User.create(vendorDoc);

  return { vendor: createdVendor, created: true };
};

const getProfileForService = (service, slot) => {
  const theme = detectTheme(service);
  const profiles = THEME_PROFILES[theme] || THEME_PROFILES.general;
  const index = hashString(`${service._id}:${service.title}:${slot}`) % profiles.length;
  return profiles[index];
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the environment.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "EventOrbit",
  });

  const services = await Service.find({}).sort({ createdAt: 1 });

  let vendorsCreated = 0;
  let vendorsSkipped = 0;
  const finalVendorCounts = [];

  for (const service of services) {
    const candidateVendorIds = [
      service.vendorId ? String(service.vendorId) : null,
      ...(Array.isArray(service.vendorIds) ? service.vendorIds.map(String) : []),
    ].filter(Boolean);

    const existingVendorDocs = await User.find({
      _id: { $in: candidateVendorIds },
    }).select("_id");

    const resolvedVendorIds = new Set(
      existingVendorDocs.map((vendor) => String(vendor._id)),
    );

    // Ensure the primary vendor exists.
    if (!service.vendorId || !(await User.exists({ _id: service.vendorId }))) {
      const profile = getProfileForService(service, 1);
      const { vendor, created } = await ensureVendor(service, 1, profile);
      if (created) vendorsCreated += 1;
      else vendorsSkipped += 1;
      service.vendorId = vendor._id;
      resolvedVendorIds.add(String(vendor._id));
    }

    // Guarantee the service has at least two linked vendors.
    while (resolvedVendorIds.size < 2) {
      const slot = resolvedVendorIds.size + 1;
      const profile = getProfileForService(service, slot);
      const { vendor, created } = await ensureVendor(service, slot, profile);
      if (created) vendorsCreated += 1;
      else vendorsSkipped += 1;
      resolvedVendorIds.add(String(vendor._id));
    }

    await Service.updateOne(
      { _id: service._id },
      {
        $set: {
          vendorId: service.vendorId,
          vendorIds: Array.from(resolvedVendorIds),
        },
      },
    );

    finalVendorCounts.push({
      serviceId: String(service._id),
      serviceTitle: service.title,
      vendorCount: resolvedVendorIds.size,
    });
  }

  console.log("Service vendor seeding completed successfully.");
  console.log(`Total Services found: ${services.length}`);
  console.log(`Vendors created: ${vendorsCreated}`);
  console.log(`Vendors skipped (already existed): ${vendorsSkipped}`);
  console.log("Final vendor count for each Service:");
  finalVendorCounts.forEach((entry) => {
    console.log(`  - ${entry.serviceTitle} (${entry.serviceId}): ${entry.vendorCount}`);
  });

  const underProvisioned = finalVendorCounts.filter((entry) => entry.vendorCount < 2);
  if (underProvisioned.length > 0) {
    throw new Error(
      `Seeding finished, but ${underProvisioned.length} service(s) still have fewer than 2 vendors.`,
    );
  }
};

run()
  .catch((error) => {
    console.error("Service vendor seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
