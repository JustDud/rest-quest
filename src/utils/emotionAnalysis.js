const highStress = ['overwhelmed', 'stressed', 'anxious', 'pressure', 'deadline', 'burnout'];
const lowStress = ['calm', 'peaceful', 'relaxed', 'rested', 'content'];
const highEnergy = ['energetic', 'active', 'excited', 'motivated', 'ready'];
const lowEnergy = ['tired', 'exhausted', 'drained', 'fatigued', 'sleepy'];

const triggerKeywords = ['work', 'deadlines', 'relationships', 'family', 'travel', 'money', 'health'];

const emotionLabels = [
  { key: 'stressed', threshold: 75 },
  { key: 'anxious', threshold: 60 },
  { key: 'neutral', threshold: 40 },
  { key: 'calm', threshold: 20 },
  { key: 'peaceful', threshold: 0 },
];

export function mockEmotionAnalysis(text = '') {
  const lower = text.toLowerCase();
  const stressScore = Math.min(
    100,
    Math.max(
      12,
      highStress.reduce((score, word) => (lower.includes(word) ? score + 18 : score), 10) -
        lowStress.reduce((score, word) => (lower.includes(word) ? score - 12 : score), 0)
    )
  );

  const energyScore = Math.min(
    100,
    Math.max(
      8,
      highEnergy.reduce((score, word) => (lower.includes(word) ? score + 20 : score), 30) -
        lowEnergy.reduce((score, word) => (lower.includes(word) ? score - 15 : score), 0)
    )
  );

  const valence = Math.max(5, Math.min(95, 100 - stressScore + energyScore / 3));

  const dominantEmotion =
    emotionLabels.find((label) => stressScore >= label.threshold)?.key ?? 'peaceful';

  const triggers = triggerKeywords.filter((word) => lower.includes(word));

  const recommendations = [];
  if (stressScore > 75) recommendations.push('deep ocean therapy', 'digital sabbath');
  if (energyScore < 40) recommendations.push('restorative breathwork', 'guided journaling');
  if (valence < 40) recommendations.push('nature immersion', 'awe practices');
  if (!recommendations.length) recommendations.push('maintenance rituals', 'gratitude scans');

  return {
    stress: Math.round(stressScore),
    energy: Math.round(energyScore),
    valence: Math.round(valence),
    dominantEmotion,
    triggers: triggers.length ? triggers : ['work rhythm', 'self-expectations'],
    recommendations,
  };
}
