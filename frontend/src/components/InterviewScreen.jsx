import React, { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import { detectObjects, loadModel as loadCoco } from "../utils/objectDetection";
import { checkIfLookingAway } from "../utils/focusDetection";
import { logEvent as logEventApi, uploadVideo, endInterview as endInterviewApi, startInterview as startInterviewApi } from "../services/api";
import { Button } from './ui/button.jsx';
import { Card, CardHeader, CardContent } from './ui/card.jsx';

export default function InterviewScreen({ candidateId, onCompleted }) {
  const videoRef = useRef();
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const [logs, setLogs] = useState([]);

  // Threshold timers state
  const lookingAwayStartRef = useRef(null);
  const noFaceStartRef = useRef(null);
  const multipleFacesActiveRef = useRef(false);
  const backgroundVoiceStartRef = useRef(null);
  const lastBackgroundVoiceLoggedRef = useRef(0);

  // Audio analysis
  const audioAnalyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioDataRef = useRef(null);
  const freqDataRef = useRef(null);
  const intervalRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const resumeIntervalRef = useRef(null);
  const audioBaselineRef = useRef({ rms: null, db: null });
  const calSamplesRef = useRef({ rms: [], db: [] });
  const calibrateUntilRef = useRef(0);
  const anyAudioStartRef = useRef(null);
  const recorderSessionIdRef = useRef(0);
  const lastDetectionsRef = useRef([]);

  const logEvent = useCallback(async (event, deduction, label, bbox) => {
    const payload = { event, timestamp: new Date(), deduction, label, bbox };
    setLogs((prev) => [{ ...payload }, ...prev].slice(0, 200));
    await logEventApi(candidateId, payload);
  }, [candidateId]);

  // MediaRecorder MIME negotiation (webm-only to avoid cross-browser crashes)
  const getSupportedMimeType = () => {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    for (const type of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
    }
    return null; // let browser choose
  };

  const setupMediaRecorder = (stream) => {
    // Pick supported mime
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};

    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (err) {
      // Fallback with browser default (new session)
      try {
        recorder = new MediaRecorder(stream);
      } catch (e2) {
        console.error('MediaRecorder start failed:', e2);
        return;
      }
    }

    mediaRecorderRef.current = recorder;

    // New session; guard chunks by sessionId
    const sessionId = Date.now();
    recorderSessionIdRef.current = sessionId;
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (recorderSessionIdRef.current !== sessionId) return;
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onerror = (err) => {
      // Do not swap recorders mid-session; prevents mixed-chunk streams
      console.error('MediaRecorder error:', err);
    };

    recorder.onstop = () => {
      // no-op
    };

    // 5-second chunks
    recorder.start(5000);
  };

  useEffect(() => {
    const init = async () => {
      try { await startInterviewApi(candidateId); } catch (_) {}
      const MODEL_URL = process.env.REACT_APP_FACEAPI_MODELS_URL || "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        loadCoco()
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      try { await videoRef.current.play(); } catch (_) {}
      if (videoRef.current && videoRef.current.readyState < 2) {
        await new Promise((resolve) => {
          const handler = () => { resolve(); };
          videoRef.current.addEventListener('loadeddata', handler, { once: true });
        });
      }
      setupMediaRecorder(stream);

      // Setup WebAudio analyser for background voice detection
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        // Add filtering to focus on speech band and reject low/high-frequency noise
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 80; // remove hum/rumble but keep low voice
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 8000; // include higher sibilants

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 4096;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.08;
        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(analyser);
        audioAnalyserRef.current = analyser;
        audioDataRef.current = new Float32Array(analyser.fftSize);
        freqDataRef.current = new Float32Array(analyser.frequencyBinCount);
        audioContextRef.current = audioCtx;
        // Start a short calibration period (5s)
        calibrateUntilRef.current = Date.now() + 5000;
        calSamplesRef.current = { rms: [], db: [] };

        // Attempt immediate resume; many browsers require user gesture and may suspend on visibility changes
        const tryResume = () => {
          if (audioContextRef.current && audioContextRef.current.state !== 'running') {
            audioContextRef.current.resume().catch(() => {});
          }
        };
        tryResume();

        const resumeOnGesture = () => tryResume();
        const resumeOnVisibility = () => tryResume();
        document.addEventListener('click', resumeOnGesture);
        document.addEventListener('keydown', resumeOnGesture);
        document.addEventListener('touchstart', resumeOnGesture, { passive: true });
        document.addEventListener('visibilitychange', resumeOnVisibility);

        // Periodic resume guard in case the context gets suspended silently
        resumeIntervalRef.current = setInterval(tryResume, 3000);

        // Cleanup listeners on unmount
        const cleanupResume = () => {
          document.removeEventListener('click', resumeOnGesture);
          document.removeEventListener('keydown', resumeOnGesture);
          document.removeEventListener('touchstart', resumeOnGesture);
          document.removeEventListener('visibilitychange', resumeOnVisibility);
          if (resumeIntervalRef.current) {
            clearInterval(resumeIntervalRef.current);
            resumeIntervalRef.current = null;
          }
        };
        // Attach to ref so outer cleanup can call
        audioContextRef.current._cleanupResume = cleanupResume;
      } catch (err) {
        console.error('AudioContext/Analyser init failed', err);
      }

      intervalRef.current = setInterval(async () => {
        const videoEl = videoRef.current;
        if (!videoEl || videoEl.readyState < 2) return;
        const detections = await faceapi
          .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        lastDetectionsRef.current = detections;

        const now = Date.now();
        // No face threshold: >10s
        if (detections.length === 0) {
          if (!noFaceStartRef.current) noFaceStartRef.current = now;
          if (now - noFaceStartRef.current > 10000) {
            await logEvent('NO_FACE', 5);
            noFaceStartRef.current = now + 3600000; // avoid re-logging until reset when face returns
          }
          // Reset others
          lookingAwayStartRef.current = null;
          multipleFacesActiveRef.current = false;
        } else {
          // Face present => reset no-face timer
          noFaceStartRef.current = null;

          // Multiple faces immediate, log once per occurrence
          if (detections.length > 1) {
            if (!multipleFacesActiveRef.current) {
              await logEvent('MULTIPLE_FACES', 20);
              multipleFacesActiveRef.current = true;
            }
          } else {
            multipleFacesActiveRef.current = false;

            // Single face: check focus
            const away = checkIfLookingAway(detections[0]);
            if (away) {
              if (!lookingAwayStartRef.current) lookingAwayStartRef.current = now;
              if (now - lookingAwayStartRef.current > 5000) {
                await logEvent('FOCUS_LOST', 5);
                lookingAwayStartRef.current = now + 3600000; // avoid repeats until focus returns
              }
            } else {
              lookingAwayStartRef.current = null; // reset when looking back
            }
          }
        }

        // Audio detection runs in a separate faster interval for responsiveness

      const objects = await detectObjects(videoRef.current);
        for (const obj of objects) {
          const normalized = obj.class.toLowerCase();
          if (["cell phone", "book", "laptop", "phone"].includes(normalized)) {
            const bbox = obj.bbox; // [x, y, width, height]
            await logEvent('SUSPICIOUS_ITEM', 10, normalized, bbox);
          }
        }
    }, 1000);

    // Faster audio interval (250ms) using latest face landmarks
    audioIntervalRef.current = setInterval(async () => {
      try {
        const analyser = audioAnalyserRef.current;
        if (!analyser) return;
        const buf = audioDataRef.current;
        analyser.getFloatTimeDomainData(buf);
        let sumSquares = 0;
        for (let i = 0; i < buf.length; i++) sumSquares += buf[i] * buf[i];
        const rms = Math.sqrt(sumSquares / buf.length);

        const freq = freqDataRef.current;
        analyser.getFloatFrequencyData(freq);
        const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
        const fftSize = analyser.fftSize;
        const binHz = sampleRate / fftSize;
        const startBin = Math.max(0, Math.floor(40 / binHz));
        const endBin = Math.min(freq.length - 1, Math.ceil(9000 / binHz));
        let sumDb = 0;
        let count = 0;
        for (let i = startBin; i <= endBin; i++) { sumDb += freq[i]; count++; }
        const avgDbSpeechBand = count > 0 ? (sumDb / count) : -100;

        if (Date.now() < calibrateUntilRef.current) {
          calSamplesRef.current.rms.push(rms);
          calSamplesRef.current.db.push(avgDbSpeechBand);
        } else if (audioBaselineRef.current.rms == null && calSamplesRef.current.rms.length > 0) {
          const sortedRms = [...calSamplesRef.current.rms].sort((a, b) => a - b);
          const sortedDb = [...calSamplesRef.current.db].sort((a, b) => a - b);
          const midR = Math.floor(sortedRms.length / 2);
          const midD = Math.floor(sortedDb.length / 2);
          const medianRms = sortedRms.length % 2 ? sortedRms[midR] : (sortedRms[midR - 1] + sortedRms[midR]) / 2;
          const medianDb = sortedDb.length % 2 ? sortedDb[midD] : (sortedDb[midD - 1] + sortedDb[midD]) / 2;
          audioBaselineRef.current = { rms: medianRms, db: medianDb };
        }

        // Mouth openness from last detections (if available)
        let mouthOpenNorm = 0;
        const detections = lastDetectionsRef.current || [];
        if (detections.length === 1) {
          const lm = detections[0].landmarks;
          const mouth = lm.getMouth ? lm.getMouth() : [];
          const leftEye = lm.getLeftEye();
          const rightEye = lm.getRightEye();
          const interPupil = Math.hypot(
            rightEye[0].x - leftEye[0].x,
            rightEye[0].y - leftEye[0].y
          ) || 1;
          if (mouth.length >= 12) {
            const top = mouth[3];
            const bottom = mouth[9];
            const horizLeft = mouth[0];
            const horizRight = mouth[6];
            const vertical = Math.hypot(bottom.x - top.x, bottom.y - top.y) / interPupil;
            const horizontal = Math.hypot(horizRight.x - horizLeft.x, horizRight.y - horizLeft.y) / interPupil;
            mouthOpenNorm = vertical / (horizontal || 1);
          }
        }

        const AUDIO_RMS_THRESHOLD = 0.0016;
        const AUDIO_BAND_DB_THRESHOLD = -78;
        const MOUTH_OPEN_THRESHOLD = 0.28;
        const nowTs = Date.now();

        const base = audioBaselineRef.current;
        const dynamicRmsThresh = base.rms != null ? Math.min(0.02, Math.max(0.0015, base.rms * 1.25)) : AUDIO_RMS_THRESHOLD;
        const dynamicDbThresh = base.db != null ? base.db + 0.5 : AUDIO_BAND_DB_THRESHOLD;
        const audioIsLoud = rms > dynamicRmsThresh || avgDbSpeechBand > dynamicDbThresh;
        const mouthIsClosed = mouthOpenNorm < MOUTH_OPEN_THRESHOLD || !Number.isFinite(mouthOpenNorm);

        if (audioIsLoud && mouthIsClosed) {
          if (!backgroundVoiceStartRef.current) backgroundVoiceStartRef.current = nowTs;
          if (nowTs - backgroundVoiceStartRef.current > 700 && nowTs - lastBackgroundVoiceLoggedRef.current > 5000) {
            await logEvent('SUSPICIOUS_AUDIO', 0, 'background_voice');
            lastBackgroundVoiceLoggedRef.current = nowTs;
          }
        } else {
          backgroundVoiceStartRef.current = null;
        }

        const VERY_LOUD_RMS = Math.max(dynamicRmsThresh * 1.25, 0.004);
        const VERY_LOUD_DB = Math.max(dynamicDbThresh - 8, -68);
        const audioIsVeryLoud = rms > VERY_LOUD_RMS || avgDbSpeechBand > VERY_LOUD_DB;
        if (audioIsVeryLoud) {
          if (!anyAudioStartRef.current) anyAudioStartRef.current = nowTs;
          if (nowTs - anyAudioStartRef.current > 600 && nowTs - lastBackgroundVoiceLoggedRef.current > 5000) {
            await logEvent('SUSPICIOUS_AUDIO', 0, 'loud_audio');
            lastBackgroundVoiceLoggedRef.current = nowTs;
          }
        } else {
          anyAudioStartRef.current = null;
        }
      } catch (e) {
        // ignore analyser errors
      }
    }, 250);
    };

    init();
    return () => {
      // Cleanup audio resume listeners
      if (audioContextRef.current && audioContextRef.current._cleanupResume) {
        audioContextRef.current._cleanupResume();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      // Stop and cleanup media stream
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (_) {}
        streamRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.srcObject = null; } catch (_) {}
      }
    };
  }, [logEvent]);


  const [ending, setEnding] = useState(false);

  const endInterview = async () => {
    try {
      if (ending) return;
      setEnding(true);
      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state === 'recording') {
        try { recorder.requestData(); } catch (_) {}
        await new Promise((resolve) => {
          recorder.onstop = resolve;
          recorder.stop();
        });
      }

      if (recordedChunksRef.current.length > 0) {
        const type = (mediaRecorderRef.current && mediaRecorderRef.current.mimeType) || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type });
        const file = new File([blob], `${candidateId}-${Date.now()}.webm`, { type });
        await uploadVideo(candidateId, file);
      }

      await endInterviewApi(candidateId);
      if (typeof onCompleted === 'function') onCompleted();
    } catch (e) {
      console.error(e);
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[640px_minmax(0,1fr)] gap-4">
      <Card>
        <CardContent>
          <div className="flex flex-col items-start">
            <video ref={videoRef} autoPlay muted width={640} height={480} className="rounded-md border border-slate-200" />
            <div className="mt-3">
              <Button onClick={endInterview} disabled={ending}>{ending ? 'Ending...' : 'End Interview'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <strong>Live Detections</strong>
        </CardHeader>
        <CardContent>
          <ul className="list-none p-0 max-h-[480px] overflow-auto">
            {logs.map((log, idx) => (
              <li key={idx} className="border-b border-slate-100 py-2">
                <div className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                <div className="font-medium">{log.event}</div>
                {log.label && <div>Label: {log.label}</div>}
                {Array.isArray(log.bbox) && <div>BBox: [{log.bbox.join(', ')}]</div>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
