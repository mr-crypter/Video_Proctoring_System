import mongoose from "mongoose";
import { initGridFS } from "./gridfs.js";

export async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set in environment");
    return;
  }
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    // Initialize GridFS whether the connection is already open or when it opens
    if (mongoose.connection && mongoose.connection.db) {
      initGridFS();
    } else {
      mongoose.connection.once('open', () => {
        initGridFS();
      });
    }
  } catch (error) {
    console.error("MongoDB connection error", error);
    process.exit(1);
  }
}


