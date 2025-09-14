// Normalize API base: allow REACT_APP_API_URL to be backend origin (no trailing /api)
const BASE_URL = (() => {
  const raw = process.env.REACT_APP_API_URL;
  if (raw && typeof raw === 'string') {
    const origin = raw.replace(/\/$/, '');
    return `${origin}/api`;
  }
  return "http://localhost:5000/api";
})();

export async function logEvent(candidateId, payload) {
  await fetch(`${BASE_URL}/log/${candidateId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getReport(candidateId) {
  const res = await fetch(`${BASE_URL}/report/${candidateId}`);
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

export async function endInterview(candidateId) {
  await fetch(`${BASE_URL}/end/${candidateId}`, { method: 'POST' });
}

export async function startInterview(candidateId) {
  await fetch(`${BASE_URL}/start/${candidateId}`, { method: 'POST' });
}

export async function uploadVideo(candidateId, file) {
  const form = new FormData();
  form.append('video', file);
  const res = await fetch(`${BASE_URL}/upload-video/${candidateId}`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) throw new Error('Failed to upload video');
  return res.json();
}

export async function createCandidate(name) {
  const res = await fetch(`${BASE_URL}/candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create candidate');
  return res.json();
}


