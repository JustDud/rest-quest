export const journeyPath = [
  {
    section: 0,
    position: { x: 65, y: 18 },
    safeZone: { minX: 60, maxX: 85, minY: 10, maxY: 25 },
    message: 'Let’s begin your wellness journey ✨',
    flightPath: 'straight',
  },
  {
    section: 1,
    position: { x: 75, y: 38 },
    safeZone: { minX: 70, maxX: 90, minY: 30, maxY: 50 },
    message: 'Tell me how you’re feeling today 🌊',
    flightPath: 'arc-right',
  },
  {
    section: 2,
    position: { x: 25, y: 35 },
    safeZone: { minX: 15, maxX: 35, minY: 25, maxY: 45 },
    message: 'Share your preferences with me 🎯',
    flightPath: 'arc-left',
  },
  {
    section: 3,
    position: { x: 70, y: 25 },
    safeZone: { minX: 65, maxX: 85, minY: 15, maxY: 35 },
    message: 'Understanding your unique needs 📊',
    flightPath: 'spiral',
  },
  {
    section: 4,
    position: { x: 50, y: 65 },
    safeZone: { minX: 45, maxX: 55, minY: 60, maxY: 75 },
    message: 'Your personalized journey awaits 🗺️',
    flightPath: 'glide-down',
  },
];
