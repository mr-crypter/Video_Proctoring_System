import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  event: { type: String, required: true }, // e.g., FOCUS_LOST, NO_FACE, MULTIPLE_FACES, SUSPICIOUS_ITEM
  timestamp: { type: Date, required: true },
  deduction: { type: Number, default: 0 },
  label: { type: String }, // object class label when applicable
  bbox: { type: [Number], default: undefined } // [x, y, width, height]
});

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  videoFileUrl: { type: String },
  events: { type: [EventSchema], default: [] }
});

export const Candidate = mongoose.model("Candidate", CandidateSchema);
