import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Candidate } from '../models/Candidate.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const candidate = await Candidate.create({
      name: 'Sample Candidate',
      startTime: new Date(),
      events: []
    });

    console.log('Inserted candidate with id:', candidate._id.toString());
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();


