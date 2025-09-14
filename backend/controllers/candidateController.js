import { Candidate } from "../models/Candidate.js";
import mongoose from 'mongoose';
import { calculateIntegrityScore } from "../utils/calculateScore.js";
import { getGridFSBucket } from "../config/gridfs.js";

export async function logEvent(req, res) {
  try {
    const { candidateId } = req.params;
    const { event, timestamp, deduction, label, bbox } = req.body;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).send({ success: false, message: "Invalid candidateId" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).send({ success: false, message: "Candidate not found" });
    }

    candidate.events.push({ event, timestamp, deduction, label, bbox });
    await candidate.save();

    return res.send({ success: true });
  } catch (error) {
    return res.status(500).send({ success: false, message: "Failed to log event", error: error.message });
  }
}

export async function getReport(req, res) {
  try {
    const { candidateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).send({ success: false, message: "Invalid candidateId" });
    }
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).send({ success: false, message: "Candidate not found" });
    }

    const events = candidate.events || [];
    const startTs = candidate.startTime ? new Date(candidate.startTime).getTime() : null;
    const endTs = candidate.endTime ? new Date(candidate.endTime).getTime() : null;
    const eventsWindow = startTs
      ? events.filter(e => {
          const t = new Date(e.timestamp).getTime();
          if (Number.isFinite(endTs)) return t >= startTs && t <= endTs;
          return t >= startTs;
        })
      : events;
    const integrityScore = calculateIntegrityScore(eventsWindow);

    const focusLostCount = eventsWindow.filter(e => e.event === 'FOCUS_LOST').length;
    const noFaceCount = eventsWindow.filter(e => e.event === 'NO_FACE').length;
    const multipleFacesCount = eventsWindow.filter(e => e.event === 'MULTIPLE_FACES').length;
    const suspiciousItems = eventsWindow.filter(e => e.event === 'SUSPICIOUS_ITEM');

    const report = {
      candidateName: candidate.name,
      interviewDurationMs: candidate.endTime && candidate.startTime ? (new Date(candidate.endTime).getTime() - new Date(candidate.startTime).getTime()) : null,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      focusLostCount,
      noFaceCount,
      multipleFacesCount,
      suspiciousEvents: suspiciousItems,
      integrityScore,
      videoFileUrl: candidate.videoFileId ? `/api/video/${candidate._id.toString()}` : candidate.videoFileUrl,
    };

    return res.send(report);
  } catch (error) {
    return res.status(500).send({ success: false, message: "Failed to fetch report", error: error.message });
  }
}

export async function startInterview(req, res) {
  try {
    const { candidateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).send({ success: false, message: "Invalid candidateId" });
    }
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).send({ success: false, message: "Candidate not found" });
    }
    candidate.startTime = new Date();
    candidate.endTime = undefined;
    await candidate.save();
    return res.send({ success: true, startTime: candidate.startTime });
  } catch (error) {
    return res.status(500).send({ success: false, message: 'Failed to start interview', error: error.message });
  }
}

export async function endInterview(req, res) {
  try {
    const { candidateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).send({ success: false, message: "Invalid candidateId" });
    }
    const candidate = await Candidate.findByIdAndUpdate(candidateId, { endTime: new Date() }, { new: true });
    if (!candidate) return res.status(404).send({ success: false, message: 'Candidate not found' });
    return res.send({ success: true });
  } catch (error) {
    return res.status(500).send({ success: false, message: 'Failed to end interview', error: error.message });
  }
}

export async function createCandidate(req, res) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).send({ success: false, message: 'Name is required' });
    }
    const candidate = await Candidate.create({ name, startTime: new Date(), events: [] });
    return res.status(201).send({ success: true, candidateId: candidate._id.toString(), name: candidate.name });
  } catch (error) {
    return res.status(500).send({ success: false, message: 'Failed to create candidate', error: error.message });
  }
}


export async function uploadVideoToGridFS(req, res) {
  try {
    const { candidateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).send({ success: false, message: "Invalid candidateId" });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).send({ success: false, message: 'No video file received' });
    }

    const bucket = getGridFSBucket();
    const filename = `${candidateId}-${Date.now()}.webm`;
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        candidateId,
        contentType: req.file.mimetype || 'video/webm'
      }
    });

    uploadStream.on('error', (err) => {
      return res.status(500).send({ success: false, message: 'GridFS upload failed', error: err.message });
    });

    uploadStream.on('finish', async () => {
      try {
        const fileId = uploadStream.id;
        await Candidate.findByIdAndUpdate(
          candidateId,
          { videoFileId: fileId },
          { new: true }
        );
        return res.send({ success: true, fileId: fileId?.toString?.() || null, filename });
      } catch (e) {
        return res.status(500).send({ success: false, message: 'Failed to persist video reference', error: e.message });
      }
    });

    uploadStream.end(req.file.buffer);
  } catch (error) {
    return res.status(500).send({ success: false, message: 'Failed to upload video', error: error.message });
  }
}

export async function streamVideoFromGridFS(req, res) {
  try {
    const { candidateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).send({ success: false, message: "Invalid candidateId" });
    }
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || !candidate.videoFileId) {
      return res.status(404).send({ success: false, message: 'Video not found' });
    }
    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId(candidate.videoFileId);
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send({ success: false, message: 'Video file not found in storage' });
    }
    const file = files[0];
    const range = req.headers.range;
    res.set({
      'Content-Type': file.metadata?.contentType || 'video/webm',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename="${file.filename}"`
    });
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
      const chunkSize = (end - start) + 1;
      res.status(206);
      res.set({ 'Content-Range': `bytes ${start}-${end}/${file.length}`, 'Content-Length': chunkSize });
      const stream = bucket.openDownloadStream(fileId, { start, end: end + 1 });
      stream.on('error', () => { if (!res.headersSent) res.sendStatus(500); });
      return stream.pipe(res);
    }
    const stream = bucket.openDownloadStream(fileId);
    stream.on('error', () => { if (!res.headersSent) res.sendStatus(500); });
    return stream.pipe(res);
  } catch (error) {
    if (!res.headersSent) return res.status(500).send({ success: false, message: 'Failed to stream video', error: error.message });
  }
}

