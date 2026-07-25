import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Category from "../src/models/Category.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const categorySeed = [
  {
    name: "Wedding Halls",
    description: "Elegant banquet halls and wedding venues with premium hospitality.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
    icon: "briefcase",
    status: "Active",
    vendors: 1,
    bookings: 2,
    revenue: 620000,
    listings: 2,
  },
  {
    name: "Catering",
    description: "Buffet menus, live stations, desserts, and custom tasting experiences.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80",
    icon: "utensils-crossed",
    status: "Active",
    vendors: 1,
    bookings: 2,
    revenue: 420000,
    listings: 2,
  },
  {
    name: "Photography",
    description: "Cinematic wedding photography, candid storytelling, and portrait sessions.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    icon: "camera",
    status: "Active",
    vendors: 1,
    bookings: 1,
    revenue: 180000,
    listings: 1,
  },
  {
    name: "DJ & Sound",
    description: "Premium sound systems, lighting rigs, and event DJ curation.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80",
    icon: "music",
    status: "Active",
    vendors: 1,
    bookings: 1,
    revenue: 95000,
    listings: 1,
  },
  {
    name: "Salon & Makeup",
    description: "Bridal beauty, pre-wedding grooming, and premium makeup artistry.",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    icon: "sparkles",
    status: "Active",
    vendors: 1,
    bookings: 1,
    revenue: 88000,
    listings: 1,
  },
  {
    name: "Decor & Styling",
    description: "Stage decor, floral installs, entrance styling, and custom themes.",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
    icon: "flower",
    status: "Active",
    vendors: 1,
    bookings: 1,
    revenue: 240000,
    listings: 1,
  },
  {
    name: "Floral Arrangements",
    description: "Fresh bouquet design, stage florals, and aisle decor arrangements.",
    image: "https://images.unsplash.com/photo-1469259943454-aa100abba749?auto=format&fit=crop&w=900&q=80",
    icon: "paintbrush",
    status: "Active",
    vendors: 1,
    bookings: 1,
    revenue: 70000,
    listings: 1,
  },
  {
    name: "Videography",
    description: "Wedding films, reels, drone coverage, and documentary edits.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    icon: "video",
    status: "Active",
    vendors: 1,
    bookings: 0,
    revenue: 0,
    listings: 1,
  },
  {
    name: "Event Planning",
    description: "Full-service coordination, timelines, vendor management, and guest flow.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
    icon: "grid",
    status: "Draft",
    vendors: 1,
    bookings: 0,
    revenue: 0,
    listings: 0,
  },
  {
    name: "Invitations & Stationery",
    description: "Custom invitation suites, RSVP cards, menus, and table stationery.",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
    icon: "mail",
    status: "Active",
    vendors: 0,
    bookings: 0,
    revenue: 0,
    listings: 0,
  },
  {
    name: "Transportation",
    description: "Wedding car rentals, guest shuttles, and luxury transport coordination.",
    image: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
    icon: "car-front",
    status: "Active",
    vendors: 0,
    bookings: 0,
    revenue: 0,
    listings: 0,
  },
  {
    name: "Lighting & Production",
    description: "Stage lighting, uplighting, LED walls, and full event production support.",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
    icon: "lightbulb",
    status: "Active",
    vendors: 0,
    bookings: 0,
    revenue: 0,
    listings: 0,
  },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the environment.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "EventOrbit",
  });

  let created = 0;
  let skipped = 0;

  for (const category of categorySeed) {
    const existing = await Category.findOne({ name: category.name }).lean();

    if (existing) {
      skipped += 1;
      continue;
    }

    await Category.create(category);
    created += 1;
  }

  const allCategories = await Category.find({}).sort({ name: 1 }).lean();

  console.log("Category seeding completed successfully.");
  console.log(`Total categories found: ${allCategories.length}`);
  console.log(`Categories created: ${created}`);
  console.log(`Categories skipped: ${skipped}`);
  console.log("Final category list:");
  for (const category of allCategories) {
    console.log(`- ${category.name}: ${category.status || "Active"}`);
  }
};

run()
  .catch((error) => {
    console.error("Category seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
