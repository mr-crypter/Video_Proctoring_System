import mongoose from "mongoose";

let gridFsBucket = null;

export function initGridFS() {
  const connection = mongoose.connection;
  if (!connection || !connection.db) {
    console.error("GridFS init failed: no active mongoose connection");
    return null;
  }
  gridFsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
    bucketName: "videos",
  });
  console.log("GridFSBucket initialized (bucket: videos)");
  return gridFsBucket;
}

export function getGridFSBucket() {
  if (!gridFsBucket) {
    throw new Error("GridFSBucket not initialized. Ensure initGridFS() is called after Mongo connects.");
  }
  return gridFsBucket;
}


