const WORDS_PER_MINUTE = 220;
const SHORT_POST_MIN = 1;

export const estimateReadingMinutes = (text: string): number => {
  if (!text) return SHORT_POST_MIN;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return SHORT_POST_MIN;
  return Math.max(SHORT_POST_MIN, Math.round(words / WORDS_PER_MINUTE));
};
