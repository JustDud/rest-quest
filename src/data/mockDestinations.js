export const destinations = [
  {
    id: 'costa-rica-ocean',
    name: 'Silent Ocean Retreat',
    location: 'Costa Rica',
    country: '🇨🇷',
    duration: 5,
    price: 890,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    healingType: 'water',
    healingAura: '#6BA5C0',
    
    match: {
      percentage: 96,
      reasoning: [
        'Ocean therapy proven for severe burnout',
        'Structured schedule removes decision fatigue',
        'Small group (8 people) for gentle connection'
      ]
    },
    
    healingProfile: {
      stressReduction: 94,
      energyRestoration: 87,
      mentalClarity: 91,
      bestFor: ['Burnout', 'Anxiety', 'Overwhelm'],
      timeline: '3-5 days for noticeable shift'
    },
    
    availability: {
      nextDate: 'This Friday',
      spotsLeft: 3,
      urgency: 'high'
    },
    
    experience: {
      daily: [
        '6am: Sunrise beach meditation',
        '7am: Nourishing breakfast in silence',
        '9am: Ocean sound therapy session',
        '11am: Guided breathwork & movement',
        '1pm: Solo reflection time',
        '4pm: Group sharing circle (optional)',
        '6pm: Sunset gratitude practice',
        '8pm: Restorative sleep routine'
      ],
      included: [
        'All meals (plant-based, locally sourced)',
        'Private beachfront room',
        'Daily 1:1 wellness coaching',
        'Organic bath amenities',
        'Healing journal & guides'
      ]
    },
    
    testimonials: [
      {
        name: 'Sarah M.',
        stress: { before: 92, after: 38 },
        quote: 'I arrived broken and left whole. The ocean held me when I couldn\'t hold myself.'
      }
    ]
  },
  
  {
    id: 'swiss-alps-silence',
    name: 'Mountain Silence Monastery',
    location: 'Swiss Alps',
    country: '🇨🇭',
    duration: 7,
    price: 1200,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    healingType: 'mountain',
    healingAura: '#F5F5F7',
    
    match: {
      percentage: 84,
      reasoning: [
        'Complete silence gives overactive mind rest',
        'Mountain air rebuilds physical energy',
        'Zero external demands for full week'
      ]
    },
    
    healingProfile: {
      stressReduction: 89,
      energyRestoration: 92,
      mentalClarity: 96,
      bestFor: ['Decision fatigue', 'Overthinking', 'Mental exhaustion'],
      timeline: '2-3 days for clarity breakthrough'
    },
    
    availability: {
      nextDate: 'Next Monday',
      spotsLeft: 2,
      urgency: 'medium'
    },
    
    experience: {
      daily: [
        '5:30am: Silent sunrise hike',
        '7am: Contemplative breakfast',
        '9am: Solo meditation in nature',
        '11am: Gentle yoga flow',
        '1pm: Silent lunch with mountain views',
        '3pm: Free time for reflection',
        '5pm: Guided walking meditation',
        '7pm: Candlelit dinner in silence',
        '9pm: Sleep hygiene ritual'
      ],
      included: [
        'Private mountain-view room',
        'All organic vegetarian meals',
        'Daily mountain hikes',
        'Meditation guidance materials',
        'Cold plunge therapy'
      ]
    }
  },
  
  {
    id: 'local-urban-spa',
    name: 'Urban Sanctuary Reset',
    location: 'Your City',
    country: '🏙️',
    duration: 0.17, // 4 hours
    price: 120,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    healingType: 'immediate',
    healingAura: '#6DD4BD',
    
    match: {
      percentage: 78,
      reasoning: [
        'Available TODAY - immediate relief',
        'Buys time to plan longer retreat',
        'Reduces acute anxiety symptoms'
      ]
    },
    
    healingProfile: {
      stressReduction: 62,
      energyRestoration: 54,
      mentalClarity: 48,
      bestFor: ['Acute stress', 'Emergency reset', 'Quick relief'],
      timeline: 'Same-day anxiety reduction'
    },
    
    availability: {
      nextDate: 'Today at 4pm',
      spotsLeft: 1,
      urgency: 'critical'
    },
    
    experience: {
      daily: [
        '4:00pm: Arrival & herbal tea ceremony',
        '4:20pm: 60min flotation therapy',
        '5:30pm: 45min deep tissue massage',
        '6:20pm: 20min guided meditation',
        '6:45pm: Integration & reflection',
        '7:00pm: Departure with tools'
      ],
      included: [
        'Flotation tank session',
        'Therapeutic massage',
        'Meditation guidance',
        'Take-home relaxation audio',
        'Emergency calm toolkit'
      ]
    }
  },
  
  {
    id: 'bali-yoga-temple',
    name: 'Sacred Bali Yoga Temple',
    location: 'Ubud, Bali',
    country: '🇮🇩',
    duration: 6,
    price: 750,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    healingType: 'spiritual',
    healingAura: '#A68BAC',
    match: { 
      percentage: 88,
      reasoning: [
        'Spiritual practices for deep inner work',
        'Tropical healing environment',
        'Expert yoga and meditation guidance'
      ]
    },
    healingProfile: {
      stressReduction: 86,
      energyRestoration: 89,
      mentalClarity: 84,
      bestFor: ['Spiritual seeking', 'Emotional healing', 'Self-discovery'],
      timeline: '4-6 days for transformation'
    },
    availability: {
      nextDate: 'Next Wednesday',
      spotsLeft: 4,
      urgency: 'medium'
    }
  },
  
  {
    id: 'iceland-thermal',
    name: 'Northern Lights Thermal Spa',
    location: 'Iceland',
    country: '🇮🇸',
    duration: 4,
    price: 1400,
    image: 'https://images.unsplash.com/photo-1517639493569-5666a7556ae3?w=800',
    healingType: 'elemental',
    healingAura: '#6BA5C0',
    match: { 
      percentage: 82,
      reasoning: [
        'Thermal waters for physical release',
        'Unique natural environment',
        'Northern lights for wonder and awe'
      ]
    },
    healingProfile: {
      stressReduction: 85,
      energyRestoration: 78,
      mentalClarity: 88,
      bestFor: ['Physical tension', 'Awe experiences', 'Elemental connection'],
      timeline: '3-4 days for physical reset'
    },
    availability: {
      nextDate: 'Next Saturday',
      spotsLeft: 2,
      urgency: 'high'
    }
  },
  
  {
    id: 'japan-zen',
    name: 'Kyoto Zen Garden Retreat',
    location: 'Kyoto, Japan',
    country: '🇯🇵',
    duration: 5,
    price: 1100,
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
    healingType: 'mindfulness',
    healingAura: '#9DC88D',
    match: { 
      percentage: 90,
      reasoning: [
        'Zen philosophy for mental clarity',
        'Traditional Japanese healing practices',
        'Minimalist environment reduces overwhelm'
      ]
    },
    healingProfile: {
      stressReduction: 91,
      energyRestoration: 85,
      mentalClarity: 94,
      bestFor: ['Mental clarity', 'Mindfulness practice', 'Cultural immersion'],
      timeline: '4-5 days for clarity breakthrough'
    },
    availability: {
      nextDate: 'Next Tuesday',
      spotsLeft: 3,
      urgency: 'high'
    }
  },
  
  {
    id: 'morocco-desert',
    name: 'Sahara Desert Silence',
    location: 'Morocco',
    country: '🇲🇦',
    duration: 4,
    price: 680,
    image: 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=800',
    healingType: 'elemental',
    healingAura: '#C4A574',
    match: { 
      percentage: 79,
      reasoning: [
        'Desert solitude for deep reflection',
        'Stargazing for perspective shift',
        'Minimal distractions for inner work'
      ]
    },
    healingProfile: {
      stressReduction: 83,
      energyRestoration: 76,
      mentalClarity: 87,
      bestFor: ['Perspective seeking', 'Solitude', 'Elemental connection'],
      timeline: '3-4 days for reflection'
    },
    availability: {
      nextDate: 'Next Thursday',
      spotsLeft: 5,
      urgency: 'low'
    }
  },
  
  {
    id: 'norway-fjord',
    name: 'Norwegian Fjord Cabin',
    location: 'Norway',
    country: '🇳🇴',
    duration: 5,
    price: 950,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    healingType: 'solitude',
    healingAura: '#6BA5C0',
    match: { 
      percentage: 85,
      reasoning: [
        'Complete isolation for deep rest',
        'Nature immersion without demands',
        'Slow pace for nervous system reset'
      ]
    },
    healingProfile: {
      stressReduction: 88,
      energyRestoration: 91,
      mentalClarity: 85,
      bestFor: ['Complete rest', 'Nature immersion', 'Nervous system reset'],
      timeline: '4-5 days for full reset'
    },
    availability: {
      nextDate: 'Next Friday',
      spotsLeft: 1,
      urgency: 'high'
    }
  },
  
  {
    id: 'mexico-surf',
    name: 'Surf Therapy Mexico',
    location: 'Tulum, Mexico',
    country: '🇲🇽',
    duration: 6,
    price: 890,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    healingType: 'movement',
    healingAura: '#6DD4BD',
    match: { 
      percentage: 91,
      reasoning: [
        'Physical movement releases tension',
        'Flow state from surfing',
        'Warm water for comfort and healing'
      ]
    },
    healingProfile: {
      stressReduction: 88,
      energyRestoration: 94,
      mentalClarity: 81,
      bestFor: ['Physical tension', 'Empowerment', 'Flow state'],
      timeline: '4-6 days for confidence boost'
    },
    availability: {
      nextDate: 'Next Sunday',
      spotsLeft: 3,
      urgency: 'medium'
    }
  },
  
  {
    id: 'thailand-forest',
    name: 'Thai Forest Monastery',
    location: 'Chiang Mai, Thailand',
    country: '🇹🇭',
    duration: 10,
    price: 450,
    image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
    healingType: 'spiritual',
    healingAura: '#9DC88D',
    match: { 
      percentage: 87,
      reasoning: [
        'Extended time for deep transformation',
        'Monastic practices for inner peace',
        'Forest setting for grounding'
      ]
    },
    healingProfile: {
      stressReduction: 92,
      energyRestoration: 85,
      mentalClarity: 94,
      bestFor: ['Deep transformation', 'Life transitions', 'Purpose seeking'],
      timeline: '7-10 days for profound shift'
    },
    availability: {
      nextDate: 'Next Month',
      spotsLeft: 6,
      urgency: 'low'
    }
  }
];

// Emotional state templates for demo
export const emotionalStates = {
  burnout: {
    stress: 94,
    burnout: 87,
    energy: 23,
    socialConnection: 34,
    mentalClarity: 28,
    physicalTension: 89,
    emotionalVolatility: 76,
    hopeScore: 42,
    emotions: ['exhausted', 'overwhelmed', 'numb', 'depleted'],
    primaryNeed: 'deep rest',
    urgency: 'critical',
    bestHealingTypes: ['water', 'immediate', 'structured']
  },
  
  anxiety: {
    stress: 82,
    burnout: 54,
    energy: 45,
    socialConnection: 28,
    mentalClarity: 38,
    physicalTension: 78,
    emotionalVolatility: 88,
    hopeScore: 56,
    emotions: ['anxious', 'restless', 'fearful', 'tense'],
    primaryNeed: 'grounding',
    urgency: 'high',
    bestHealingTypes: ['mindfulness', 'spiritual', 'elemental']
  },
  
  stagnation: {
    stress: 64,
    burnout: 48,
    energy: 52,
    socialConnection: 61,
    mentalClarity: 44,
    physicalTension: 58,
    emotionalVolatility: 42,
    hopeScore: 48,
    emotions: ['stuck', 'unfulfilled', 'lost', 'disconnected'],
    primaryNeed: 'inspiration',
    urgency: 'medium',
    bestHealingTypes: ['movement', 'adventure', 'spiritual']
  }
};

