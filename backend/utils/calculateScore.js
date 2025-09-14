export function calculateIntegrityScore(events) {
  // Deduction rules:
  // -5 for focus lost event
  // -10 for suspicious item (phone/book/paper/extra devices)
  // -20 for multiple faces
  const totalDeduction = (events || []).reduce((sum, e) => {
    if (e.event === 'FOCUS_LOST') return sum + 5;
    if (e.event === 'SUSPICIOUS_ITEM') return sum + 10;
    if (e.event === 'MULTIPLE_FACES') return sum + 20;
    return sum;
  }, 0);
  const score = 100 - totalDeduction;
  return Math.max(0, Math.min(100, score));
}


