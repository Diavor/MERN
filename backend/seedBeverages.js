// Idempotent seed for the "Bevande" catalog. Safe to re-run: it only inserts
// beverages that don't already exist (matched by name) and never touches other
// products or data.
//
//   node backend/seedBeverages.js
import dotenv from "dotenv";
import connectDB, { disconnectDB } from "./config/db.js";
import Product from "./models/productModel.js";
import User from "./models/userModel.js";
import beverages from "./data/beverages.js";

dotenv.config();

const run = async () => {
  await connectDB();
  const admin = await User.findOne({ isAdmin: true }).select("_id");
  if (!admin) {
    console.error("No admin user found — run the main seeder first.");
    await disconnectDB();
    process.exit(1);
  }

  let created = 0;
  for (const b of beverages) {
    const exists = await Product.findOne({ name: b.name });
    if (!exists) {
      await Product.create({ ...b, user: admin._id });
      created += 1;
    }
  }

  console.log(
    `Beverages seeded — ${created} created, ${beverages.length - created} already existed.`
  );
  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
