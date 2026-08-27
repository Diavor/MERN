// Idempotent seed for the CMS-driven home page (slug "home"). Safe to re-run:
// it upserts by slug and never touches other pages. The storefront `/` route
// renders this page; if it's ever deleted the app falls back to the built-in
// HomeScreen.
//
//   node backend/seedHomePage.js

import dotenv from "dotenv";
import connectDB, { disconnectDB } from "./config/db.js";
import Page from "./models/pageModel.js";
import User from "./models/userModel.js";

dotenv.config();

const homeBlocks = [
  {
    id: "home-hero",
    type: "hero",
    data: {
      image: null,
      overlay: 30,
      title: "Pizzeria Grani Antichi",
      subtitle: "Sforniamo pizze di qualità dal 2017.",
      ctaText: "Vedi il menu",
      ctaUrl: "/menu",
      align: "center",
    },
  },
  {
    id: "home-intro",
    type: "text",
    data: {
      align: "center",
      html:
        "<h2>Un locale open space vista cucina</h2><p>Farine da <strong>grani antichi</strong>, lunga lievitazione e ingredienti scelti. A Mogliano Veneto, dal 2017.</p>",
    },
  },
  {
    id: "home-cta",
    type: "button",
    data: { text: "Ordina ora", url: "/menu", style: "ember", icon: "arrow" },
  },
  {
    id: "home-map",
    type: "map",
    data: { query: "Via Antonio Canova 23, 31021 Mogliano Veneto", zoom: 15 },
  },
];

const run = async () => {
  await connectDB();
  const admin = await User.findOne({ isAdmin: true }).select("_id");
  const doc = {
    title: "Pizzeria Grani Antichi",
    status: "published",
    visibility: "public",
    blocks: homeBlocks,
    seo: {
      title: "Pizzeria Grani Antichi · Mogliano Veneto",
      description: "Sforniamo pizze di qualità dal 2017. Farine da grani antichi, lunga lievitazione. Mogliano Veneto.",
      keywords: "pizzeria, grani antichi, mogliano veneto, pizza",
      canonical: "https://www.pizzeriagraniantichi.it/",
      ogImage: "",
    },
    ...(admin && { user: admin._id }),
  };

  const existing = await Page.findOne({ slug: "home" });
  if (existing) {
    Object.assign(existing, doc, { slug: "home" });
    await existing.save();
    console.log("Home page updated (slug: home)");
  } else {
    await Page.create({ ...doc, slug: "home" });
    console.log("Home page created (slug: home)");
  }

  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
