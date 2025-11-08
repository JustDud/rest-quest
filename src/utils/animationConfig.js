export const easing = [0.4, 0, 0.2, 1];

export const breathingDurations = {
  inhale: 4000,
  hold: 7000,
  exhale: 8000,
};

export const springs = {
  card: { type: 'spring', stiffness: 260, damping: 28 },
  gentle: { type: 'spring', stiffness: 140, damping: 20 },
  elastic: { type: 'spring', stiffness: 320, damping: 18 },
};

export const transitions = {
  section: { duration: 0.6, ease: easing },
  micro: { duration: 0.25, ease: easing },
  slow: { duration: 1.2, ease: easing },
};

export const particleConfig = {
  ambient: {
    desktop: 30,
    mobile: 15,
    colors: ['#3BC9DB', '#B197FC', '#FFE8CC'],
    sizeRange: [2, 10],
    opacityRange: [0.2, 0.6],
    speedRange: [0.15, 0.6],
    swayRange: [10, 20],
    repelDistance: 100,
  },
  orb: {
    baseCount: 12,
    maxCount: 40,
    baseSpeed: 0.8,
    maxSpeed: 2.4,
  },
  celebration: {
    count: 70,
    gravity: 0.35,
    colors: ['#3BC9DB', '#1971C2', '#B197FC', '#FFE8CC', '#51CF66'],
  },
};
