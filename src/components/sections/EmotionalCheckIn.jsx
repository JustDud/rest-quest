import React, { useContext, useMemo, useState } from 'react';
import { Sparkles, MessageCircle, Send } from 'lucide-react';
import { EmotionalContext } from '../../contexts/EmotionalContext';
import { GlassCard } from '../ui/GlassCard';
import { ParticleField } from '../ui/ParticleField';
import { OrbParticles } from '../particles/OrbParticles';
import { useTypedText } from '../../hooks/useTypedText';
import { LiveEmotionVisual } from '../ui/LiveEmotionVisual';
import { ConversationLog } from '../ui/ConversationLog';
import { CameraPreview } from '../ui/CameraPreview';

export function EmotionalCheckIn() {
  const {
    analyzeEntry,
    analysis,
    startGuidedSession,
    sessionStarting,
    sessionEvents,
  } = useContext(EmotionalContext);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const typedHeadline = useTypedText(
    'Choose how you’d like to connect—either let Serenity guide a live conversation or send a written reflection.',
    24
  );

  const orbColor = useMemo(() => {
    if (!analysis) return 'from-[#3BC9DB] to-[#B197FC]';
    if (analysis.stress > 80) return 'from-[#F06595] to-[#F783AC]';
    if (analysis.stress > 55) return 'from-[#F59F00] to-[#FFD43B]';
    return 'from-[#51CF66] to-[#3BC9DB]';
  }, [analysis]);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    try {
      await analyzeEntry(chatInput.trim());
      setChatInput('');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section id="emotional-checkin" data-cinematic-section="1" className="relative py-24 px-6 overflow-hidden">
      <ParticleField count={22} speed={analysis ? Math.max(0.8, analysis.stress / 60) : 1} className="opacity-30" />
      <div className="max-w-3xl mx-auto" data-cinematic-content="1">
        <GlassCard className="p-8 text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 relative">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${orbColor} animate-pulse`} />
              <OrbParticles stress={analysis?.stress ?? 40} color="#3BC9DB" className="mix-blend-screen" />
            </div>
            <h2 className="text-3xl font-['Plus_Jakarta_Sans'] text-[#0B1728]">How do you want to check in?</h2>
            <p className="text-[#0B1728]/70 max-w-2xl mx-auto">{typedHeadline}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <button
              type="button"
              onClick={startGuidedSession}
              disabled={sessionStarting}
              className="flex-1 rounded-3xl border border-white/70 bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] px-6 py-5 text-white font-semibold serenity-interactive disabled:opacity-60"
            >
              <div className="flex flex-col items-center gap-2">
                <Sparkles size={22} />
                <span>{sessionStarting ? 'Starting…' : 'Start live conversation'}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="flex-1 rounded-3xl border border-[#E7F5FF] bg-white px-6 py-5 text-[#0B1728] font-semibold serenity-interactive"
            >
              <div className="flex flex-col items-center gap-2">
                <MessageCircle size={22} />
                <span>Chat conversation</span>
              </div>
            </button>
          </div>
          <LiveEmotionVisual emotion={analysis} />
          {showChat && (
            <div className="text-left space-y-4">
              <div className="rounded-3xl bg-white/80 border border-[#E7F5FF] p-6 space-y-4">
                <div className="max-h-64 overflow-y-auto pr-1">
                  <ConversationLog events={sessionEvents.slice(-10).reverse()} />
                </div>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your reply..."
                  className="serenity-input w-full h-28 rounded-2xl bg-white/90 shadow-inner"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleChatSend}
                    disabled={chatLoading}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] text-white px-5 py-2 serenity-interactive disabled:opacity-60"
                  >
                    <Send size={16} />
                    {chatLoading ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
              <div className="rounded-3xl bg-white/60 border border-[#E7F5FF] p-4">
                <CameraPreview />
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
