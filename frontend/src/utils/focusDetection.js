export function checkIfLookingAway(detection) {
  const landmarks = detection.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();

  // Helper to compute centroid of points
  const centroid = (points) => {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const leftCenter = centroid(leftEye);
  const rightCenter = centroid(rightEye);
  const eyeMid = { x: (leftCenter.x + rightCenter.x) / 2, y: (leftCenter.y + rightCenter.y) / 2 };
  const interPupilDistance = Math.hypot(rightCenter.x - leftCenter.x, rightCenter.y - leftCenter.y) || 1;

  // Approximate nose tip by centroid of lower nose points
  const noseTip = centroid(nose.slice(Math.floor(nose.length / 2)));

  // Normalize deviations by inter-pupil distance to be scale invariant
  const horizontalDeviation = Math.abs(noseTip.x - eyeMid.x) / interPupilDistance;
  const verticalDeviation = Math.abs(noseTip.y - eyeMid.y) / interPupilDistance;

  // Thresholds tuned for typical webcam geometry
  const H_THRESHOLD = 0.35; // looking left/right
  const V_THRESHOLD = 0.45; // looking up/down (reading/looking down)

  return horizontalDeviation > H_THRESHOLD || verticalDeviation > V_THRESHOLD;
}
