import React, { useContext, useMemo, useState } from 'react';
import { Sparkles, MessageCircle, Send, Mic, AlertCircle, Volume2 } from 'lucide-react';
import { EmotionalContext, ANALYSIS_BASE_URL } from '../../contexts/EmotionalContext';
import { GlassCard } from '../ui/GlassCard';
import { ParticleField } from '../ui/ParticleField';
import { OrbParticles } from '../particles/OrbParticles';
import { useTypedText } from '../../hooks/useTypedText';
import { LiveEmotionVisual } from '../ui/LiveEmotionVisual';
import { CameraPreview } from '../ui/CameraPreview';
import { ConversationLog } from '../ui/ConversationLog';

export function EmotionalCheckIn() {
  const {
    analyzeEntry,
    analysis,
    startGuidedSession,
    stopGuidedSession,
    sessionStarting,
    liveEmotion,
    sessionEvents,
    sessionActive,
    sessionError,
    listeningForResponse,
    currentQuestion,
    micStatus,
    audioNeedsInteraction,
    requestSessionAudioPlayback,
  } = useContext(EmotionalContext);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatError, setChatError] = useState(null);
  const typedHeadline = useTypedText(
    'Choose how you’d like to connect—either let Serenity guide a live conversation or send a written reflection.',
    24
  );
  const chatEndpoint = `${ANALYSIS_BASE_URL}/chat/respond`;
  const sessionEmotion = liveEmotion ?? analysis;
  const showLiveSession = sessionActive || sessionEvents.length > 0;
  const micStatusLabelMap = {
    recording: 'Recording your response…',
    listening: 'Listening for your voice…',
    blocked: 'Microphone permission needed',
    error: 'Microphone unavailable',
    idle: 'Microphone standing by',
  };
  const micStatusClassMap = {
    recording: 'bg-[#d3f9d8] text-[#2b8a3e]',
    listening: 'bg-[#e3fafc] text-[#0b7285]',
    blocked: 'bg-[#fff3bf] text-[#e67700]',
    error: 'bg-[#ffe3e3] text-[#c92a2a]',
    idle: 'bg-[#edf2ff] text-[#364fc7]',
  };
  const micStatusLabel = micStatusLabelMap[micStatus] ?? micStatusLabelMap.idle;
  const micStatusClass = micStatusClassMap[micStatus] ?? micStatusClassMap.idle;
  const currentQuestionText = currentQuestion?.question?.trim();

  const orbColor = useMemo(() => {
    if (!analysis) return 'from-[#3BC9DB] to-[#B197FC]';
    if (analysis.stress > 80) return 'from-[#F06595] to-[#F783AC]';
    if (analysis.stress > 55) return 'from-[#F59F00] to-[#FFD43B]';
    return 'from-[#51CF66] to-[#3BC9DB]';
  }, [analysis]);

  const handleChatSend = async () => {
    const content = chatInput.trim();
    if (!content) return;

    const userMessage = { id: `u-${Date.now()}`, role: 'user', content };
    const pendingHistory = [...chatMessages, userMessage];
    setChatMessages(pendingHistory);
    setChatInput('');
    // Keep the analysis pipeline updated for visuals + preferences.
    analyzeEntry(content);

    const payload = {
      message: content,
      history: pendingHistory.slice(-8).map(({ role, content: text }) => ({ role, content: text })),
      emotionContext: analysis
        ? {
            stress: analysis.stress,
            energy: analysis.energy,
            valence: analysis.valence,
            dominantEmotion: analysis.dominantEmotion ?? analysis.overallMood ?? analysis.dominant,
          }
        : undefined,
    };

    if (!payload.emotionContext && liveEmotion?.spectrum) {
      payload.emotionContext = {
        spectrum: liveEmotion.spectrum,
        dominantEmotion: liveEmotion.dominant,
      };
    }

    setChatLoading(true);
    setChatError(null);
    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Chat service error: ${response.status}`);
      }
      const data = await response.json();
      const assistantContent = data?.reply?.trim()
        ? data.reply.trim()
        : "I'm still gathering my thoughts—mind sharing a bit more about how that feels in your body?";
      setChatMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: assistantContent, source: data?.source },
      ]);
      setChatError(null);
    } catch (error) {
      console.warn('Chat conversation failed', error);
      setChatError('Serenity is offline—try again in a moment.');
    } finally {
      setChatLoading(false);
    }
  };

  const renderChatMessage = (message) => {
    const isUser = message.role === 'user';
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} text-sm`}
      >
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] text-white'
              : 'bg-white shadow border border-[#E7F5FF] text-[#0B1728]'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && message.source === 'fallback' && (
            <p className="text-[11px] uppercase tracking-[0.3em] mt-2 text-[#1971C2]/70">Fallback</p>
          )}
        </div>
      </div>
    );
  };

  const openChatPanel = () => setShowChat(true);
  const handleStartLiveConversation = () => {
    setShowChat(true);
    startGuidedSession();
  };
  const handleStopLiveConversation = () => {
    stopGuidedSession();
  };

  const renderChatBody = () => {
    if (!chatMessages.length) {
      return (
        <div className="rounded-2xl bg-white/70 border border-white/70 p-4 text-sm text-[#0B1728]/70">
          Serenity will reply here once you send your first reflection.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {chatMessages.map(renderChatMessage)}
        {chatLoading && (
          <div className="text-xs text-[#1971C2] italic animate-pulse">Serenity is composing a response…</div>
        )}
      </div>
    );
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
              onClick={handleStartLiveConversation}
              disabled={sessionStarting || sessionActive}
              className="flex-1 rounded-3xl border border-white/70 bg-gradient-to-r from-[#1971C2] to-[#3BC9DB] px-6 py-5 text-white font-semibold serenity-interactive disabled:opacity-60"
            >
              <div className="flex flex-col items-center gap-2">
                <Sparkles size={22} />
                <span>
                  {sessionActive ? 'Session in progress' : sessionStarting ? 'Starting…' : 'Start live conversation'}
                </span>
              </div>
            </button>
            {sessionActive && (
              <button
                type="button"
                onClick={handleStopLiveConversation}
                className="flex-1 rounded-3xl border border-[#FFE3E3] bg-white px-6 py-5 text-[#C92A2A] font-semibold serenity-interactive"
              >
                <div className="flex flex-col items-center gap-2">
                  <span>Stop sound agent</span>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={openChatPanel}
              className="flex-1 rounded-3xl border border-[#E7F5FF] bg-white px-6 py-5 text-[#0B1728] font-semibold serenity-interactive"
            >
              <div className="flex flex-col items-center gap-2">
                <MessageCircle size={22} />
                <span>Chat conversation</span>
              </div>
            </button>
          </div>
          {sessionError && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#FFE3E3] bg-[#FFF5F5] px-4 py-3 text-sm text-[#C92A2A]">
              <AlertCircle size={16} />
              <span>{sessionError}</span>
            </div>
          )}
          <LiveEmotionVisual emotion={sessionEmotion} />
          {showLiveSession && (
            <div className="grid gap-6 lg:grid-cols-2 text-left">
              <div className="rounded-3xl bg-white/90 border border-[#E7F5FF] p-6 space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#1971C2]/80">
                  <span>Live conversation</span>
                  {sessionActive && (
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#1098F7]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#51CF66] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#51CF66]" />
                      </span>
                      Active
                    </span>
                  )}
                </div>
                {currentQuestionText && (
                  <div className="rounded-2xl bg-[#F8F9FA] text-[#0B1728]/80 px-4 py-3 text-sm">
                    {listeningForResponse ? 'Listening to: ' : 'Asked: '}
                    <span className="font-medium text-[#0B1728]">{currentQuestionText}</span>
                  </div>
                )}
                <ConversationLog events={sessionEvents} />
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${micStatusClass}`}>
                    <Mic size={14} />
                    {micStatusLabel}
                  </span>
                  {listeningForResponse && (
                    <span className="text-[#0B1728]/60">Serenity is capturing your voice and expressions.</span>
                  )}
                  {audioNeedsInteraction && (
                    <button
                      type="button"
                      onClick={requestSessionAudioPlayback}
                      className="inline-flex items-center gap-2 rounded-full border border-[#1971C2]/30 bg-white px-3 py-1 text-[#1971C2] serenity-interactive"
                    >
                      <Volume2 size={14} />
                      Enable Serenity audio
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-3xl bg-white/60 border border-[#E7F5FF] p-4">
                <CameraPreview desiredActive={sessionActive} />
              </div>
            </div>
          )}
          {showChat && (
            <div className="text-left space-y-4">
              <div className="rounded-3xl bg-white/90 border border-[#E7F5FF] p-6 space-y-4">
                <div className="max-h-72 overflow-y-auto pr-2">{renderChatBody()}</div>
                {chatError && <p className="text-xs text-[#E03131]">{chatError}</p>}
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="Let Serenity know what's on your mind…"
                  className="serenity-input w-full h-28 rounded-2xl bg-white/95 shadow-inner"
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
              {!showLiveSession && (
                <div className="rounded-3xl bg-white/60 border border-[#E7F5FF] p-4">
                  <CameraPreview />
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
