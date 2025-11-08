import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';

const soundscapes = [
  {
    id: 'ocean',
    label: 'Ocean waves',
    description: 'Grounding tides + distant gulls',
    url: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_aeff27495f.mp3?filename=ocean-ambient-wave-137043.mp3',
    moods: ['stressed', 'overwhelmed'],
  },
  {
    id: 'rain',
    label: 'Rain on leaves',
    description: 'Soft rainfall + gentle thunder',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/01/audio_4a3e8f9877.mp3?filename=soft-rain-ambient-110397.mp3',
    moods: ['anxious', 'restless'],
  },
  {
    id: 'forest',
    label: 'Forest dawn',
    description: 'Birdsong + breeze in pines',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/13/audio_65ee0ad201.mp3?filename=forest-birds-ambience-118208.mp3',
    moods: ['low-energy', 'calm'],
  },
  {
    id: 'bowls',
    label: 'Singing bowls',
    description: 'Crystal bowls + airy harmonics',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/14/audio_5f59f77927.mp3?filename=singing-bowl-meditation-118252.mp3',
    moods: ['neutral', 'peaceful'],
  },
];

const dots = Array.from({ length: 3 });

export function AmbientSoundscape({ analysis }) {
  const audioRef = useRef(null);
  const fadeInterval = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [userSelected, setUserSelected] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('ocean');

  const recommendedTrack = useMemo(() => {
    if (!analysis) return 'ocean';
    if (analysis.stress > 70) return 'ocean';
    if (analysis.stress > 55) return 'rain';
    if (analysis.energy < 45) return 'forest';
    if (analysis.valence > 65) return 'bowls';
    return 'forest';
  }, [analysis]);

  useEffect(() => {
    if (!userSelected) setSelectedTrack(recommendedTrack);
  }, [recommendedTrack, userSelected]);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    const handleReady = () => setIsReady(true);
    audio.addEventListener('canplaythrough', handleReady, { once: true });
    audioRef.current = audio;
    return () => {
      clearInterval(fadeInterval.current);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = soundscapes.find((item) => item.id === selectedTrack) ?? soundscapes[0];
    const wasPlaying = !audio.paused;

    audio.src = track.url;
    audio.load();

    if (wasPlaying) {
      audio
        .play()
        .then(() => fadeIn())
        .catch(() => setIsPlaying(false));
    }
  }, [selectedTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isPlaying ? volume : 0;
  }, [volume, isPlaying]);

  const fadeIn = () => {
    clearInterval(fadeInterval.current);
    const audio = audioRef.current;
    if (!audio) return;
    let current = 0;
    audio.volume = 0;
    fadeInterval.current = setInterval(() => {
      current += 0.05;
      audio.volume = Math.min(volume, current);
      if (audio.volume >= volume) clearInterval(fadeInterval.current);
    }, 100);
  };

  const fadeOut = () => {
    clearInterval(fadeInterval.current);
    const audio = audioRef.current;
    if (!audio) return;
    fadeInterval.current = setInterval(() => {
      const next = Math.max(0, audio.volume - 0.07);
      audio.volume = next;
      if (next <= 0.01) {
        clearInterval(fadeInterval.current);
        audio.pause();
      }
    }, 90);
  };

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      fadeOut();
      setIsPlaying(false);
      return;
    }
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        fadeIn();
      })
      .catch(() => setIsPlaying(false));
  }, [isPlaying, volume]);

  useEffect(() => {
    const handleKey = (event) => {
      const target = event.target;
      const tagName = target?.tagName;
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      }
      if (event.key.toLowerCase() === 'm') {
        setVolume((prev) => {
          const next = prev === 0 ? 0.65 : 0;
          if (audioRef.current) audioRef.current.volume = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlayback]);

  const handleSelect = (event) => {
    setUserSelected(true);
    setSelectedTrack(event.target.value);
  };

  const currentTrack = soundscapes.find((item) => item.id === selectedTrack) ?? soundscapes[0];

  return (
    <div className="mt-4 rounded-[28px] border border-white/50 bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/70">Ambient soundscape</p>
          <p className="text-sm text-[#0B1728]/70">
            {analysis
              ? `We suggest ${currentTrack.label.toLowerCase()} for your current state.`
              : 'Choose a sound that helps you settle.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#1971C2]">
          <Headphones size={16} />
          <span>{isReady ? 'Takes under 3 seconds' : 'Buffering waves...'}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="relative">
          <select
            aria-label="Select ambient soundscape"
            value={selectedTrack}
            onChange={handleSelect}
            className="appearance-none rounded-full bg-white/90 px-4 py-2 pr-10 text-sm text-[#0B1728] shadow-sm border border-white/60 focus:ring-2 focus:ring-[#3BC9DB]"
          >
            {soundscapes.map((sound) => (
              <option key={sound.id} value={sound.id}>
                {sound.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1971C2]">▾</span>
        </div>

        <button
          type="button"
          onClick={togglePlayback}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3BC9DB] to-[#1971C2] px-5 py-2 text-white text-sm serenity-interactive"
          aria-label={isPlaying ? 'Pause ambient soundscape' : 'Play ambient soundscape'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? 'Pause' : 'Listen'}
        </button>

        <div className="flex items-center gap-2 group">
          <Volume2 size={16} className="text-[#1971C2]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-[#3BC9DB]"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-xs text-[#0B1728]/60">
        <div>
          <p className="font-semibold text-[#0B1728]">{currentTrack.label}</p>
          <p>{currentTrack.description}</p>
        </div>
        <div className="flex items-center gap-1">
          {dots.map((_, index) => (
            <motion.span
              key={`dot-${index}`}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-[#3BC9DB] to-[#1971C2]"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
