import React, { useCallback, useEffect, useState } from 'react';
import { Camera, StopCircle, AlertCircle } from 'lucide-react';

const deriveOrigin = () => {
  const analysis = import.meta.env.VITE_ANALYSIS_ENDPOINT || 'http://localhost:8000/analysis';
  try {
    return new URL(analysis).origin;
  } catch {
    return 'http://localhost:8000';
  }
};

const ORIGIN = deriveOrigin();
const CAMERA_STREAM_ENDPOINT =
  import.meta.env.VITE_CAMERA_STREAM_ENDPOINT || `${ORIGIN}/camera/stream`;

export function CameraPreview({ desiredActive = null } = {}) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamSrc, setStreamSrc] = useState('');
  const [imgKey, setImgKey] = useState(0);
  const [autoSync, setAutoSync] = useState(true);

  const stopStream = useCallback(() => {
    setStreamSrc('');
    setActive(false);
    setLoading(false);
  }, []);

  const startStream = useCallback(() => {
    setError('');
    setLoading(true);
    setImgKey((prev) => prev + 1);
    setStreamSrc(`${CAMERA_STREAM_ENDPOINT}?t=${Date.now()}`);
    setActive(true);
  }, []);

  useEffect(() => stopStream, [stopStream]);

  useEffect(() => {
    if (desiredActive === null) return;
    if (!autoSync) return;
    if (desiredActive && !active && !loading) {
      startStream();
    } else if (!desiredActive && active) {
      stopStream();
    }
  }, [desiredActive, active, loading, startStream, stopStream, autoSync]);

  useEffect(() => {
    if (!desiredActive && !active) {
      setAutoSync(true);
    }
  }, [desiredActive, active]);

  const handleToggle = () => {
    if (active) {
      setAutoSync(false);
      stopStream();
    } else {
      setAutoSync(true);
      startStream();
    }
  };

  const handleError = () => {
    setError('Unable to load analysis stream.');
    stopStream();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/80">Live camera</p>
          <p className="text-sm text-[#0B1728]/70">
            View the annotated feed from the backend analyzer. There may be a small delay.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm serenity-interactive ${
            active
              ? 'bg-white border border-[#F06595]/40 text-[#F06595]'
              : 'bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] text-white'
          } ${loading ? 'opacity-60 cursor-wait' : ''}`}
        >
          {active ? <StopCircle size={16} /> : <Camera size={16} />}
          {active ? 'Stop camera' : loading ? 'Connecting…' : 'Open camera'}
        </button>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-[#0B1728]/60 border border-white/20 min-h-[180px] aspect-[4/3]">
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/80 px-6">
            <Camera size={36} className="mb-4 opacity-70" />
            <p className="text-sm">
              Tap &ldquo;Open camera&rdquo; to see the computer-vision overlays from the live session.
            </p>
          </div>
        )}
        {active && (
          <img
            key={imgKey}
            src={streamSrc}
            alt="Camera analysis stream"
            onLoad={() => setLoading(false)}
            onError={handleError}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#fff5f5] text-[#c92a2a] px-3 py-2 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
