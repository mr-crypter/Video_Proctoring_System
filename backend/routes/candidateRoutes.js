import express from "express";
import { logEvent, getReport, endInterview, createCandidate, startInterview } from "../controllers/candidateController.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${req.params.candidateId}-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Log an event
router.post("/log/:candidateId", logEvent);

// Get report
router.get("/report/:candidateId", getReport);

// End interview
router.post('/end/:candidateId', endInterview);

// Start interview (set current session start time)
router.post('/start/:candidateId', startInterview);

// Upload interview video
router.post('/upload-video/:candidateId', upload.single('video'), async (req, res) => {
  try {
    const { candidateId } = req.params;
    const fileUrl = `/uploads/${req.file.filename}`;
    await (await import('../models/Candidate.js')).Candidate.findByIdAndUpdate(candidateId, { videoFileUrl: fileUrl });
    return res.send({ success: true, fileUrl });
  } catch (error) {
    return res.status(500).send({ success: false, message: 'Failed to upload video', error: error.message });
  }
});

// Create candidate
router.post('/candidate', createCandidate);

export default router;
