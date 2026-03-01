/** Shared mission rank constants used by MissionLane & MissionColumn */

export const rankLabels: Record<string, string> = {
  D: 'missionD',
  C: 'missionC',
  B: 'missionB',
  A: 'missionA',
};

export const rankPoints: Record<string, number> = {
  D: 1,
  C: 2,
  B: 3,
  A: 4,
};

/** Rank-specific color config for mission lanes/columns */
export const rankTheme: Record<string, {
  border: string;
  bg: string;
  activeBorder: string;
  activeBg: string;
  activeRing: string;
  activeGlow: string;
  starFill: string;
  starText: string;
  badgeBorder: string;
  badgeText: string;
  lockedBorder: string;
}> = {
  D: {
    border: 'border-slate-700/50',
    bg: 'bg-slate-900/20',
    activeBorder: 'border-slate-500/60',
    activeBg: 'bg-slate-800/15',
    activeRing: 'ring-slate-500/25',
    activeGlow: 'rank-d-glow',
    starFill: 'fill-slate-400',
    starText: 'text-slate-400',
    badgeBorder: 'border-slate-600/50',
    badgeText: 'text-slate-400',
    lockedBorder: 'border-slate-700/30',
  },
  C: {
    border: 'border-amber-800/40',
    bg: 'bg-amber-950/15',
    activeBorder: 'border-amber-600/60',
    activeBg: 'bg-amber-900/15',
    activeRing: 'ring-amber-600/25',
    activeGlow: 'rank-c-glow',
    starFill: 'fill-amber-500',
    starText: 'text-amber-500',
    badgeBorder: 'border-amber-700/50',
    badgeText: 'text-amber-400',
    lockedBorder: 'border-amber-800/30',
  },
  B: {
    border: 'border-slate-500/40',
    bg: 'bg-slate-800/15',
    activeBorder: 'border-slate-400/60',
    activeBg: 'bg-slate-700/15',
    activeRing: 'ring-slate-400/25',
    activeGlow: 'rank-b-glow',
    starFill: 'fill-slate-300',
    starText: 'text-slate-300',
    badgeBorder: 'border-slate-500/50',
    badgeText: 'text-slate-300',
    lockedBorder: 'border-slate-500/30',
  },
  A: {
    border: 'border-yellow-700/40',
    bg: 'bg-yellow-950/15',
    activeBorder: 'border-yellow-500/60',
    activeBg: 'bg-yellow-900/15',
    activeRing: 'ring-yellow-500/30',
    activeGlow: 'rank-a-glow',
    starFill: 'fill-yellow-400',
    starText: 'text-yellow-400',
    badgeBorder: 'border-yellow-600/50',
    badgeText: 'text-yellow-400',
    lockedBorder: 'border-yellow-700/30',
  },
};
