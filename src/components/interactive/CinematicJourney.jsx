import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SpiritBird } from './SpiritBird';
import { journeyPath } from '../../data/journeyPath';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

const transitionMap = {
  '0-1': 'vertical-wipe',
  '1-2': 'arc-crossfade',
  '2-3': 'slide-blur',
  '3-4': 'spiral-fade',
};

const gradientStops = [
  { from: '#E7F5FF', to: '#E0F2FE' },
  { from: '#E0F2FE', to: '#CCFBF1' },
  { from: '#CCFBF1', to: '#DBEAFE' },
  { from: '#DBEAFE', to: '#E0F2FE' },
  { from: '#E0F2FE', to: '#F8F9FA' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toPixels = (percentPosition) => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }
  return {
    x: (percentPosition.x / 100) * window.innerWidth,
    y: (percentPosition.y / 100) * window.innerHeight,
  };
};

const throttle = (fn, wait = 16) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
};

export function CinematicJourney() {
  const [currentSection, setCurrentSection] = useState(0);
  const [percentPosition, setPercentPosition] = useState(journeyPath[0].position);
  const [pixelPosition, setPixelPosition] = useState(() => toPixels(journeyPath[0].position));
  const [birdState, setBirdState] = useState('hovering');
  const [birdMessage, setBirdMessage] = useState(journeyPath[0].message);
  const [birdTilt, setBirdTilt] = useState(0);
  const [trail, setTrail] = useState([]);
  const [pathSegments, setPathSegments] = useState([]);
  const [transitionClass, setTransitionClass] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const performanceMode = usePerformanceMode();

  const sectionsRef = useRef([]);
  const activeSectionRef = useRef(0);
  const focusTimeoutRef = useRef(null);
  const resizeHandler = useMemo(
    () =>
      throttle(() => {
        setPixelPosition(toPixels(percentPosition));
      }, 32),
    [percentPosition]
  );

  const focusSection = useCallback(
    (sectionIndex, intensity = performanceMode ? 0.18 : 0.34) => {
      if (typeof window === 'undefined') return;
      const root = document.documentElement;
      const targetSection =
        sectionsRef.current.find(
          (node) => Number(node.getAttribute('data-cinematic-section')) === sectionIndex
        ) ??
        sectionsRef.current.find(
          (node) => Number(node.getAttribute('data-cinematic-section')) === activeSectionRef.current
        );
      if (!root || !targetSection) return;
      const rect = targetSection.getBoundingClientRect();
      const xPercent = (((rect.left + rect.width / 2) / window.innerWidth) * 100).toFixed(2);
      const yPercent = (((rect.top + rect.height / 2) / window.innerHeight) * 100).toFixed(2);
      root.style.setProperty('--cursor-gradient-x', `${xPercent}%`);
      root.style.setProperty('--cursor-gradient-y', `${yPercent}%`);
      if (performanceMode) return;
      root.style.setProperty('--cursor-gradient-strength', intensity.toString());
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = setTimeout(() => {
        root.style.setProperty('--cursor-gradient-strength', '0.28');
      }, 700);
    },
    [performanceMode]
  );

  useEffect(() => () => focusTimeoutRef.current && clearTimeout(focusTimeoutRef.current), []);

  useEffect(() => {
    document.body.classList.add('serenity-cinematic-scroll');
    document.documentElement.style.setProperty('--cinematic-from', gradientStops[0].from);
    document.documentElement.style.setProperty('--cinematic-to', gradientStops[0].to);
    if (performanceMode) {
      document.body.classList.add('serenity-performance');
    } else {
      document.body.classList.remove('serenity-performance');
    }
    window.addEventListener('resize', resizeHandler);
    return () => {
      document.body.classList.remove('serenity-cinematic-scroll');
      document.body.classList.remove('serenity-performance');
      window.removeEventListener('resize', resizeHandler);
    };
  }, [resizeHandler, performanceMode]);

  useEffect(() => {
    setPixelPosition(toPixels(percentPosition));
  }, [percentPosition]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-cinematic-section]'));
    sectionsRef.current = sections;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetIndex = Number(entry.target.getAttribute('data-cinematic-section'));
            updateActiveSection(targetIndex);
          }
        });
      },
      { threshold: 0.55 }
    );
    sections.forEach((section) => observer.observe(section));
    const detachInteractions = sections.map((section) => {
      const index = Number(section.getAttribute('data-cinematic-section'));
      const handleEnter = () => focusSection(index, 0.45);
      const handleLeave = () => focusSection(activeSectionRef.current, 0.32);
      section.addEventListener('pointerenter', handleEnter);
      section.addEventListener('focusin', handleEnter);
      section.addEventListener('pointerleave', handleLeave);
      section.addEventListener('focusout', handleLeave);
      return () => {
        section.removeEventListener('pointerenter', handleEnter);
        section.removeEventListener('focusin', handleEnter);
        section.removeEventListener('pointerleave', handleLeave);
        section.removeEventListener('focusout', handleLeave);
      };
    });
    syncSectionStates(0);
    focusSection(0, 0.4);
    return () => {
      observer.disconnect();
      detachInteractions.forEach((detach) => detach());
    };
  }, [focusSection]);

  useEffect(() => {
    if (prefersReducedMotion || performanceMode) return undefined;
    setBirdState('flying');
    const timer = setTimeout(() => setBirdState('hovering'), 1800);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion, performanceMode]);

  useEffect(() => {
    if (prefersReducedMotion || performanceMode || birdState !== 'flying') {
      setTrail([]);
      setPathSegments([]);
      return undefined;
    }
    const interval = setInterval(() => {
      setTrail((prev) => {
        const next = [...prev, { id: Date.now(), ...pixelPosition }];
        return next.slice(-10);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [birdState, pixelPosition, prefersReducedMotion, performanceMode]);

  const updateActiveSection = (nextSection) => {
    setCurrentSection((prev) => {
      if (prev === nextSection) return prev;
      syncSectionStates(nextSection);
      triggerTransition(prev, nextSection);
      moveBird(nextSection);
      updateBackground(nextSection);
      activeSectionRef.current = nextSection;
      focusSection(nextSection, 0.4);
      return nextSection;
    });
  };

  const updateBackground = (sectionIndex) => {
    const palette = gradientStops[sectionIndex] ?? gradientStops[gradientStops.length - 1];
    document.documentElement.style.setProperty('--cinematic-from', palette.from);
    document.documentElement.style.setProperty('--cinematic-to', palette.to);
  };

  const syncSectionStates = (activeIndex) => {
    sectionsRef.current.forEach((section) => {
      const index = Number(section.getAttribute('data-cinematic-section'));
      if (index === activeIndex) {
        section.dataset.cinematicState = 'active';
      } else if (index < activeIndex) {
        section.dataset.cinematicState = 'previous';
      } else {
        section.dataset.cinematicState = 'upcoming';
      }
    });
    focusSection(activeIndex, 0.38);
  };

  const triggerTransition = (from, to) => {
    const key = `${from}-${to}`;
    const pattern = transitionMap[key] ?? 'soft-fade';
    setTransitionClass(pattern);
    setTimeout(() => setTransitionClass(null), 1200);
  };

  const moveBird = (targetSection) => {
    const waypoint = journeyPath.find((point) => point.section === targetSection) ?? journeyPath[journeyPath.length - 1];
    const safePercent = enforceSafeZone(waypoint);
    const adjusted = avoidCollisions(safePercent, targetSection);
    const nextPixels = toPixels(adjusted);
    const angle = Math.atan2(nextPixels.y - pixelPosition.y, nextPixels.x - pixelPosition.x);
    setBirdTilt(angle * (180 / Math.PI) * 0.1);
    setBirdMessage(waypoint.message);
    focusSection(targetSection, 0.46);

    if (!prefersReducedMotion && !performanceMode) {
      const startPixels = { ...pixelPosition };
      const curve = buildCurve(startPixels, nextPixels, waypoint.flightPath);
      if (curve) {
        setPathSegments((prev) => [...prev, { id: Date.now(), d: curve }].slice(-5));
      }
    }

    if (prefersReducedMotion || performanceMode) {
      setPercentPosition(adjusted);
      setBirdState('hovering');
      return;
    }

    setBirdState('transitioning');
    requestAnimationFrame(() => {
      setPercentPosition(adjusted);
      setBirdState('flying');
      setTimeout(() => setBirdState('hovering'), 1500);
    });
  };

  const enforceSafeZone = (waypoint) => {
    const { position, safeZone } = waypoint;
    return {
      x: clamp(position.x, safeZone.minX, safeZone.maxX),
      y: clamp(position.y, safeZone.minY, safeZone.maxY),
    };
  };

  const avoidCollisions = (positionPercent, sectionIndex) => {
    if (typeof window === 'undefined') return positionPercent;
    const nodes = document.querySelectorAll(`[data-cinematic-content="${sectionIndex}"]`);
    if (!nodes.length) return positionPercent;
    const buffer = 40;
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;
    const positionPx = {
      x: (positionPercent.x / 100) * vpWidth,
      y: (positionPercent.y / 100) * vpHeight,
    };

    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (
        positionPx.x > rect.left - buffer &&
        positionPx.x < rect.right + buffer &&
        positionPx.y > rect.top - buffer &&
        positionPx.y < rect.bottom + buffer
      ) {
        const safeZone = journeyPath.find((point) => point.section === sectionIndex)?.safeZone;
        if (!safeZone) break;
        const center = {
          x: (safeZone.minX + safeZone.maxX) / 2,
          y: (safeZone.minY + safeZone.maxY) / 2,
        };
        return center;
      }
    }
    return positionPercent;
  };

  if (typeof window === 'undefined') return null;

  return (
    <>
      {!prefersReducedMotion && !performanceMode && (
        <svg className="fixed inset-0 pointer-events-none z-[55]" aria-hidden="true">
          <defs>
            <linearGradient id="bird-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.4)" />
              <stop offset="100%" stopColor="rgba(177,151,252,0.4)" />
            </linearGradient>
          </defs>
          {pathSegments.map((segment) => (
            <motion.path
              key={segment.id}
              d={segment.d}
              fill="none"
              stroke="url(#bird-path-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.7 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
          ))}
        </svg>
      )}
      <SpiritBird
        position={pixelPosition}
        state={birdState}
        message={birdMessage}
        tilt={birdTilt}
        trail={trail}
        currentSection={currentSection}
        disabled={prefersReducedMotion || performanceMode}
      />
      <AnimatePresence>
        {transitionClass && (
          <motion.div
            key={transitionClass}
            className={`cinematic-transition-layer ${transitionClass}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}

const buildCurve = (start, end, type) => {
  if (!start || !end) return null;
  const base = {
    c1: { x: start.x + (end.x - start.x) * 0.33, y: start.y - 40 },
    c2: { x: start.x + (end.x - start.x) * 0.66, y: end.y + 40 },
  };

  const tweaks = {
    'arc-right': { c1: { x: start.x + 120, y: start.y - 80 }, c2: { x: end.x + 40, y: end.y - 20 } },
    'arc-left': { c1: { x: start.x - 120, y: start.y - 80 }, c2: { x: end.x - 40, y: end.y - 20 } },
    spiral: { c1: { x: start.x + 40, y: start.y - 120 }, c2: { x: end.x - 60, y: end.y + 20 } },
    'glide-down': { c1: { x: start.x + 30, y: start.y + 20 }, c2: { x: end.x - 10, y: end.y + 80 } },
    straight: base,
  };

  const controls = tweaks[type] ?? base;
  const c1 = controls.c1 ?? base.c1;
  const c2 = controls.c2 ?? base.c2;

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
};

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefers(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return prefers;
}
