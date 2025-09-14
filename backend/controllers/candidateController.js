import { Candidate } from "../models/Candidate.js";
import mongoose from 'mongoose';
import { calculateIntegrityScore } from "../utils/calculateScore.js";

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
      videoFileUrl: candidate.videoFileUrl,
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


