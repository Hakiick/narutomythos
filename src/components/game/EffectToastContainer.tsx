'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EffectEvent } from '@/lib/game/effects/types';
import { EffectToast } from './EffectToast';

interface EffectToastContainerProps {
  effectLog: EffectEvent[];
}

interface ToastEntry {
  event: EffectEvent;
  exiting: boolean;
}

const MAX_VISIBLE = 3;
const TOAST_DURATION = 2500;

export function EffectToastContainer({ effectLog }: EffectToastContainerProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.event.id !== id));
  }, []);

  const startExit = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.event.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => removeToast(id), 300);
  }, [removeToast]);

  useEffect(() => {
    const newEvents = effectLog.filter((e) => !seenIds.current.has(e.id));
    if (newEvents.length === 0) return;

    for (const event of newEvents) {
      seenIds.current.add(event.id);
    }

    setToasts((prev) => {
      const added = newEvents.map((event) => ({ event, exiting: false }));
      const combined = [...prev, ...added];
      return combined.slice(-MAX_VISIBLE);
    });

    // Schedule auto-dismiss for each new toast
    for (const event of newEvents) {
      setTimeout(() => startExit(event.id), TOAST_DURATION);
    }
  }, [effectLog, startExit]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-8 z-30 flex flex-col items-center gap-1">
      {toasts.map((toast) => (
        <EffectToast
          key={toast.event.id}
          event={toast.event}
          exiting={toast.exiting}
        />
      ))}
    </div>
  );
}
