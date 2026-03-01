'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRACKS = [
  { file: 'raising-fighting-spirit.mp3', title: 'The Raising Fighting Spirit' },
  { file: 'hokage.mp3', title: 'Hokage' },
  { file: 'grief-and-sorrow.mp3', title: 'Grief and Sorrow' },
  { file: 'sasukes-theme.mp3', title: "Sasuke's Theme" },
  { file: 'heavy-violence.mp3', title: 'Heavy Violence' },
  { file: 'loneliness.mp3', title: 'Loneliness' },
  { file: 'afternoon-of-konoha.mp3', title: 'Afternoon of Konoha' },
  { file: 'will-of-fire.mp3', title: 'Those Who Inherit The Will of Fire' },
  { file: 'samidare.mp3', title: 'Samidare' },
  { file: 'green-wild-beast.mp3', title: 'Beautiful Green Wild Beast' },
  { file: 'companions.mp3', title: 'Companions' },
  { file: 'main-theme-slow.mp3', title: 'Main Theme (Slow)' },
  { file: 'pein-theme.mp3', title: 'Pein Theme' },
  { file: 'gai-sensei-theme.mp3', title: 'Gai Sensei Theme' },
  { file: 'senya-itachi-theme.mp3', title: 'Senya (Itachi Theme)' },
  { file: 'avenger.mp3', title: 'Avenger' },
];

const STORAGE_KEY = 'naruto-mythos-music-enabled';
const VOLUME_KEY = 'naruto-mythos-music-volume';
const DEFAULT_VOLUME = 30;

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MusicPlayer() {
  const t = useTranslations('Play');
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [showVolume, setShowVolume] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<typeof TRACKS>([]);
  const indexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') setEnabled(true);
    const savedVol = localStorage.getItem(VOLUME_KEY);
    if (savedVol) setVolume(Number(savedVol));
  }, []);

  // Create Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Play a track by index
  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio || playlistRef.current.length === 0) return;

    const track = playlistRef.current[index % playlistRef.current.length];
    audio.src = `/audio/${track.file}`;
    audio.volume = volume / 100;
    setCurrentTitle(track.title);
    audio.play().catch(() => {
      // Autoplay may be blocked — user interaction will fix it
    });
  }, [volume]);

  // Skip to next track
  const nextTrack = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % playlistRef.current.length;
    playTrack(indexRef.current);
  }, [playTrack]);

  // Handle enable/disable
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      // Shuffle playlist on enable
      if (playlistRef.current.length === 0) {
        playlistRef.current = shuffle(TRACKS);
        indexRef.current = 0;
      }
      // Wire up ended → next track
      audio.onended = () => {
        indexRef.current = (indexRef.current + 1) % playlistRef.current.length;
        playTrack(indexRef.current);
      };
      playTrack(indexRef.current);
    } else {
      audio.pause();
      setCurrentTitle('');
    }

    return () => {
      audio.onended = null;
    };
  }, [enabled, playTrack]);

  // Update volume live
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Close volume slider on outside click
  useEffect(() => {
    if (!showVolume) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showVolume]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {/* Volume slider + track name (popup) */}
      {showVolume && enabled && (
        <div className="absolute bottom-full right-0 mb-1 flex flex-col gap-1 rounded-lg border border-border bg-card/95 px-2.5 py-2 shadow-lg backdrop-blur-sm">
          {currentTitle && (
            <span className="max-w-[160px] truncate text-[9px] font-medium text-orange-400">
              {currentTitle}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 w-20 cursor-pointer accent-orange-500"
            />
            <span className="text-[9px] tabular-nums text-muted-foreground">{volume}%</span>
          </div>
        </div>
      )}

      {/* Skip button (only when playing) */}
      {enabled && (
        <button
          type="button"
          onClick={nextTrack}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/80 text-muted-foreground transition-colors hover:bg-muted"
          title="Next track"
        >
          <SkipForward className="h-3 w-3" />
        </button>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={toggle}
        onContextMenu={(e) => {
          e.preventDefault();
          if (enabled) setShowVolume((prev) => !prev);
        }}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border transition-colors',
          enabled
            ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
            : 'border-border bg-muted/80 text-muted-foreground hover:bg-muted'
        )}
        title={t('game.musicTooltip')}
      >
        {enabled ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <VolumeX className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
