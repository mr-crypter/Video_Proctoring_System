import express from "express";
import { logEvent, getReport, endInterview, createCandidate, startInterview, uploadVideoToGridFS, streamVideoFromGridFS } from "../controllers/candidateController.js";
import multer from 'multer';

// Use memory storage; we will pipe to GridFSBucket
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Log an event
router.post("/log/:candidateId", logEvent);

// Get report
router.get("/report/:candidateId", getReport);

// End interview
router.post('/end/:candidateId', endInterview);

// Start interview (set current session start time)
router.post('/start/:candidateId', startInterview);

// Upload interview video to GridFS
router.post('/upload-video/:candidateId', upload.single('video'), uploadVideoToGridFS);

// Stream video from GridFS
router.get('/video/:candidateId', streamVideoFromGridFS);

// Create candidate
router.post('/candidate', createCandidate);

export default router;
