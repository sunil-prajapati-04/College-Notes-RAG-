import mongoose from "mongoose";
import { config } from "dotenv";

config();

const mongodbUrl = process.env.MONGODBURL;

const connectDB = async () => {
  try {
    await mongoose.connect(mongodbUrl);
    console.log("database is connected");
  } catch (err) {
    console.log("error in connecting with database:", err);
    process.exit(1);
  }
};

export default connectDB;