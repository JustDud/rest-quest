import React from 'react';

export function ConversationLog({ events = [] }) {
  if (!events.length) {
    return (
      <div className="rounded-3xl bg-white/70 border border-white/60 p-4 text-sm text-[#0B1728]/60">
        The conversation timeline will appear here once Serenity starts guiding you.
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/80 border border-white/70 p-4 space-y-3 max-h-[320px] overflow-y-auto">
      {events.map((event) => (
        <div key={event.timestamp} className="text-sm">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#1971C2]/60">
            {event.type}
          </div>
          <div className="text-[#0B1728]/80">
            {event?.payload?.text ??
              event?.payload?.question ??
              event?.payload?.message ??
              '[event]'}
          </div>
        </div>
      ))}
    </div>
  );
}
