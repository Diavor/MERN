import dotenv from "dotenv";
import "colors"; // side-effect: patches String.prototype with .green / .red etc.
import users from "./data/users.js";
import products from "./data/products.js";
import pizzas from "./data/pizzas.js";
import beverages from "./data/beverages.js";
import desserts from "./data/desserts.js";
import zones from "./data/zones.js";
import coupons from "./data/coupons.js";
import settings from "./data/settings.js";
import User from "./models/userModel.js";
import Product from "./models/productModel.js";
import Order from "./models/orderModel.js";
import Zone from "./models/zoneModel.js";
import Coupon from "./models/couponModel.js";
import Setting from "./models/settingModel.js";
import connectDB from "./config/db.js";
dotenv.config();
connectDB();
const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Zone.deleteMany();
    await Coupon.deleteMany();
    await Setting.deleteMany();
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;
    const sampleProducts = [...products, ...pizzas, ...beverages, ...desserts].map((product) => {
      return { ...product, user: adminUser };
    });
    await Product.insertMany(sampleProducts);
    await Zone.insertMany(zones);
    await Coupon.insertMany(coupons);
    await Setting.create(settings);
    console.log("Data Imported!".green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};
const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Zone.deleteMany();
    await Coupon.deleteMany();
    await Setting.deleteMany();
    console.log("Data Destroyed!".red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};
process.argv[2] === "-d" ? destroyData() : importData();
