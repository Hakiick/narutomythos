import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
}

/** Chakra cost icon — stylised swirl cloud matching the Naruto Mythos TCG cards.
 *  The real card symbol is a cloud with two spiral curls on top and a
 *  rounded bottom, with a small tail on the right. */
export function ChakraIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Cloud body fill */}
      <path
        d="M4 15.5c0-2 1.2-3.6 3-4.3C7.2 8.5 9.4 7 12 7c2.3 0 4.3 1.2 5.2 3 1.5.5 2.8 2 2.8 3.5 0 2-1.5 3.5-3.5 3.5H7c-1.7 0-3-1.3-3-1.5Z"
        fill="currentColor"
        opacity={0.25}
      />
      {/* Cloud outline */}
      <path
        d="M7 17H6.5C4.6 17 3 15.7 3 14c0-1.6 1.2-3 2.8-3.4C6.5 8.2 9 6 12 6c2.7 0 5 1.8 5.8 4.3C19.5 10.7 21 12.3 21 14.2c0 1.6-1.3 2.8-2.8 2.8H17"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left spiral curl */}
      <path
        d="M7 17c0-1.8 1.5-3.2 3.2-3.2 1.2 0 2.2.7 2.6 1.7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M9 15.5c0-.7.5-1.2 1.2-1.2.5 0 .8.3.8.7"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {/* Right spiral curl */}
      <path
        d="M17 17c0-1.8-1.5-3.2-3.2-3.2-1.2 0-2.2.7-2.6 1.7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M15 15.5c0-.7-.5-1.2-1.2-1.2-.5 0-.8.3-.8.7"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      {/* Tail wisp on right */}
      <path
        d="M19.5 14c1-.3 2.2-.1 2.5.8"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Power icon — 4-pointed shuriken (ninja star) matching the Naruto Mythos TCG cards.
 *  The real card symbol is a metallic shuriken with 4 pointed blades
 *  radiating from a centre circle. */
export function PowerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Four-pointed shuriken blades — each blade is a kite/diamond going outward */}
      <path
        d="M12 2 L14 10 L12 11.5 L10 10 Z"
        fill="currentColor"
        opacity={0.3}
      />
      <path
        d="M22 12 L14 14 L12.5 12 L14 10 Z"
        fill="currentColor"
        opacity={0.3}
      />
      <path
        d="M12 22 L10 14 L12 12.5 L14 14 Z"
        fill="currentColor"
        opacity={0.3}
      />
      <path
        d="M2 12 L10 10 L11.5 12 L10 14 Z"
        fill="currentColor"
        opacity={0.3}
      />
      {/* Shuriken outline */}
      <path
        d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Centre hole */}
      <circle
        cx="12"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth={1.3}
        fill="currentColor"
        fillOpacity={0.15}
      />
    </svg>
  );
}

/** Konoha (Hidden Leaf Village) emblem — traced from the official Wikimedia
 *  Commons vector (Simbolo_konoha.svg, CC BY-SA 3.0).
 *  A spiral with a pointed leaf tip, exactly as seen on ninja headbands
 *  and the Naruto Mythos TCG cards. */
export function KonohaIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Spiral body */}
      <path
        d="M17.25,11.76 C17.65,11.95 18.1,12.18 17.97,13.46 C17.55,14.59 16.76,15.55 14.75,15.48 C13.15,15.09 11.41,14.64 11.54,11.45 C11.68,9.8 13.41,7.51 16.34,7.49 C20.58,7.55 22.66,11.29 22.48,14.18 C22.27,18.29 18.97,20.42 14.44,20.82 C12.01,20.82 9.19,19.5 7.9,17.5 C6.29,15.42 5.67,11.14 7.03,8.32 C8.46,5.3 11.16,3.4 14.36,3.34 C17.32,3.28 19.27,4.39 20.38,5.08 L23.0,2.55"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Leaf point + base curve */}
      <path
        d="M7.58,7.33 C6.01,9.77 4.96,12.95 3.89,14.89 C3.13,16.55 2.08,17.5 1.0,18.76 C5.3,21.25 11.93,21.45 16.24,20.56"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Uzumaki spiral — large decorative spiral for hero background.
 *  Based on the iconic Uzumaki clan symbol from Naruto. */
export function UzumakiSpiralIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      <path
        d="M100 30
           C60 30 35 60 35 100
           C35 140 65 170 100 170
           C135 170 160 140 160 105
           C160 70 135 50 105 50
           C75 50 58 75 58 100
           C58 125 78 145 100 145
           C122 145 138 125 138 105
           C138 85 122 70 105 70
           C88 70 78 85 78 100
           C78 115 90 125 105 125
           C120 125 128 112 128 102
           C128 92 118 85 108 85
           C98 85 92 93 92 100
           C92 107 98 112 104 112"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Scroll icon — unrolled parchment with wooden end-caps.
 *  Used for Card Database section. */
export function ScrollIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Paper body */}
      <rect x="5" y="4" width="14" height="16" rx="1" fill="currentColor" opacity={0.15} />
      {/* Paper outline */}
      <rect x="5" y="4" width="14" height="16" rx="1" stroke="currentColor" strokeWidth={1.5} />
      {/* Top wooden roller */}
      <rect x="3" y="2.5" width="18" height="2.5" rx="1.25" fill="currentColor" opacity={0.3} />
      <rect x="3" y="2.5" width="18" height="2.5" rx="1.25" stroke="currentColor" strokeWidth={1.3} />
      {/* Bottom wooden roller */}
      <rect x="3" y="19" width="18" height="2.5" rx="1.25" fill="currentColor" opacity={0.3} />
      <rect x="3" y="19" width="18" height="2.5" rx="1.25" stroke="currentColor" strokeWidth={1.3} />
      {/* Text lines on scroll */}
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
      <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
      <line x1="8" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
    </svg>
  );
}

/** Deck icon — stack of 3 offset cards with Uzumaki spiral on top card back.
 *  Used for Deck Builder section. */
export function DeckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Bottom card */}
      <rect x="5" y="5" width="14" height="18" rx="1.5" fill="currentColor" opacity={0.1} stroke="currentColor" strokeWidth={1.2} />
      {/* Middle card */}
      <rect x="4" y="3" width="14" height="18" rx="1.5" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={1.2} />
      {/* Top card */}
      <rect x="3" y="1" width="14" height="18" rx="1.5" fill="currentColor" opacity={0.25} stroke="currentColor" strokeWidth={1.5} />
      {/* Uzumaki spiral on top card */}
      <path
        d="M10 7 C7.5 7 6 9 6 10.5 C6 12.5 8 14 10 14 C12 14 13.5 12.5 13.5 10.5 C13.5 9 12 7.5 10.5 7.5 C9 7.5 8 8.5 8 10 C8 11 9 12 10 12 C11 12 11.5 11 11.5 10.2"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
    </svg>
  );
}

/** Collection icon — Ninja Tool Pouch (hip pouch every ninja wears).
 *  Clean recognizable pouch silhouette with buckle clasp and Uzumaki spiral.
 *  Used for Collection Manager section. */
export function CollectionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Belt strap across top */}
      <rect x="2" y="5" width="20" height="3" rx="1.5" fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={1.3} />
      {/* Main pouch body — rounded rectangle hanging from belt */}
      <path
        d="M4.5 8 L4.5 19 C4.5 20.4 5.6 21.5 7 21.5 L17 21.5 C18.4 21.5 19.5 20.4 19.5 19 L19.5 8"
        fill="currentColor"
        opacity={0.12}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Flap — folds down over the top of the pouch */}
      <path
        d="M5 8 L5 12 C5 12 8 14 12 14 C16 14 19 12 19 12 L19 8"
        fill="currentColor"
        opacity={0.2}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {/* Buckle clasp — center circle */}
      <circle cx="12" cy="13" r="2" fill="currentColor" opacity={0.25} stroke="currentColor" strokeWidth={1.3} />
      {/* Uzumaki spiral inside buckle */}
      <path
        d="M12 11.5 C11 11.5 10.5 12.2 10.5 13 C10.5 13.8 11.2 14.3 12 14.3 C12.7 14.3 13.3 13.7 13.3 13 C13.3 12.4 12.8 12 12.2 12 C11.8 12 11.5 12.3 11.5 12.7"
        stroke="currentColor"
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      {/* Bottom stitch line */}
      <path d="M7 18 L17 18" stroke="currentColor" strokeWidth={0.7} strokeLinecap="round" opacity={0.25} strokeDasharray="2 1.5" />
    </svg>
  );
}

/** Ryō icon — Gama-chan, Naruto's iconic frog-shaped coin purse.
 *  Bulbous frog body with big protruding eyes sitting on top,
 *  wide grinning mouth, and a chubby belly. Unmistakably Gama-chan.
 *  Used for Market Prices section. */
export function RyoIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Chubby frog body */}
      <path
        d="M4 13 C4 9.5 7 7 12 7 C17 7 20 9.5 20 13 C20 17.5 17 21 12 21 C7 21 4 17.5 4 13Z"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {/* Wide smile / mouth opening */}
      <path
        d="M6.5 12 C8.5 14.5 15.5 14.5 17.5 12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Left eye — big bulging circle sitting on top of head */}
      <circle cx="8.5" cy="6" r="3" fill="currentColor" opacity={0.18} stroke="currentColor" strokeWidth={1.4} />
      {/* Left pupil */}
      <circle cx="9" cy="5.5" r="1.3" fill="currentColor" opacity={0.55} />
      <circle cx="9.5" cy="5" r="0.5" fill="currentColor" opacity={0.15} />
      {/* Right eye — big bulging circle sitting on top of head */}
      <circle cx="15.5" cy="6" r="3" fill="currentColor" opacity={0.18} stroke="currentColor" strokeWidth={1.4} />
      {/* Right pupil */}
      <circle cx="16" cy="5.5" r="1.3" fill="currentColor" opacity={0.55} />
      <circle cx="16.5" cy="5" r="0.5" fill="currentColor" opacity={0.15} />
      {/* Belly crease */}
      <path d="M9 16 C10.5 17.5 13.5 17.5 15 16" stroke="currentColor" strokeWidth={0.8} strokeLinecap="round" opacity={0.25} />
      {/* Coin glint — small yen/ryō mark on belly */}
      <circle cx="12" cy="16" r="1.5" stroke="currentColor" strokeWidth={0.7} opacity={0.3} />
      <path d="M11.2 16 L12.8 16" stroke="currentColor" strokeWidth={0.6} opacity={0.3} />
    </svg>
  );
}

/** News icon — Messenger Hawk soaring with wings spread wide.
 *  Dynamic silhouette of a raptor in flight carrying a small scroll.
 *  Used for News & Updates section. */
export function NewsScrollIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Left wing — swept back, powerful */}
      <path
        d="M12 10 L8 7 L2 4 C1.3 3.7 1 4.3 1.5 4.8 L6 9 L9 11"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right wing — swept back, powerful */}
      <path
        d="M12 10 L16 7 L22 4 C22.7 3.7 23 4.3 22.5 4.8 L18 9 L15 11"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body — torpedo streamlined shape */}
      <path
        d="M10 10 C10 8.5 11 7.5 12 7.5 C13 7.5 14 8.5 14 10 L14 15 C14 16 13 17 12 17 C11 17 10 16 10 15 Z"
        fill="currentColor"
        opacity={0.2}
        stroke="currentColor"
        strokeWidth={1.3}
      />
      {/* Head */}
      <circle cx="12" cy="8" r="1.8" fill="currentColor" opacity={0.25} stroke="currentColor" strokeWidth={1.2} />
      {/* Sharp beak pointing right */}
      <path d="M13.5 7.8 L16 7 L13.8 8.5" fill="currentColor" opacity={0.4} stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
      {/* Eye — fierce */}
      <circle cx="12.5" cy="7.6" r="0.6" fill="currentColor" opacity={0.65} />
      {/* Tail feathers — fan shape */}
      <path d="M10.5 17 L8 20 M12 17 L12 21 M13.5 17 L16 20" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" opacity={0.4} />
      {/* Wing feather detail lines */}
      <path d="M4 6 L7 8.5" stroke="currentColor" strokeWidth={0.7} strokeLinecap="round" opacity={0.25} />
      <path d="M20 6 L17 8.5" stroke="currentColor" strokeWidth={0.7} strokeLinecap="round" opacity={0.25} />
    </svg>
  );
}

/** Tournaments icon — Two crossed kunai knives.
 *  Clean bold X-shaped kunai with proper blade, handle, and ring pommel.
 *  Used for Organized Play / Tournaments section. */
export function HeadbandIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* === Kunai 1 — top-left to bottom-right === */}
      {/* Blade — elongated diamond from tip to crossguard */}
      <path
        d="M3 2 L6 5.5 L5 6.5 L1.5 3Z"
        fill="currentColor"
        opacity={0.35}
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* Shaft */}
      <path d="M5.5 6 L12.5 13" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      {/* Handle wrap (thicker) */}
      <path d="M12.5 13 L16 16.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" opacity={0.45} />
      {/* Ring pommel */}
      <circle cx="18.5" cy="19" r="2.8" stroke="currentColor" strokeWidth={1.5} fill="currentColor" fillOpacity={0.08} />

      {/* === Kunai 2 — top-right to bottom-left === */}
      {/* Blade — elongated diamond from tip to crossguard */}
      <path
        d="M21 2 L18 5.5 L19 6.5 L22.5 3Z"
        fill="currentColor"
        opacity={0.35}
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* Shaft */}
      <path d="M18.5 6 L11.5 13" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      {/* Handle wrap (thicker) */}
      <path d="M11.5 13 L8 16.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" opacity={0.45} />
      {/* Ring pommel */}
      <circle cx="5.5" cy="19" r="2.8" stroke="currentColor" strokeWidth={1.5} fill="currentColor" fillOpacity={0.08} />
    </svg>
  );
}

/** Jutsu book icon — closed book with Konoha symbol on cover.
 *  Used for Rulebook section. */
export function JutsuBookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Book spine and pages */}
      <path
        d="M4 4 C4 2.9 4.9 2 6 2 L18 2 C19.1 2 20 2.9 20 4 L20 20 C20 21.1 19.1 22 18 22 L6 22 C4.9 22 4 21.1 4 20 Z"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {/* Page edges */}
      <path d="M7 2 L7 22" stroke="currentColor" strokeWidth={1} opacity={0.3} />
      {/* Konoha symbol on cover (simplified spiral + leaf) */}
      <path
        d="M14 8.5 C12.5 8.5 11.5 9.5 11.5 10.8 C11.5 12 12.5 13 13.8 13 C15 13 16 12 16 10.8 C16 9.5 15 8.8 14 8.8 C13.2 8.8 12.5 9.5 12.5 10.5 C12.5 11.2 13 11.8 13.8 11.8"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <path d="M11.5 12.5 L10 14" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      {/* Decorative lines */}
      <line x1="10" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.3} />
      <line x1="10" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.3} />
    </svg>
  );
}

/** Sharingan icon — iconic 3-tomoe Sharingan eye.
 *  Red eye with 3 black comma-shaped tomoe around the pupil.
 *  Used for Card Scanner section. */
export function SharinganIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Outer eye shape (almond) */}
      <path
        d="M2 12 C2 12 6 5 12 5 C18 5 22 12 22 12 C22 12 18 19 12 19 C6 19 2 12 2 12Z"
        fill="currentColor"
        opacity={0.1}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Iris circle */}
      <circle cx="12" cy="12" r="5" fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={1.3} />
      {/* Pupil */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity={0.7} />
      {/* Tomoe 1 (top) */}
      <path
        d="M12 7.5 C12.8 7.5 13.2 8.5 12.5 9 C11.5 9.5 11 8.5 12 7.5Z"
        fill="currentColor"
        opacity={0.65}
      />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" opacity={0.65} />
      {/* Tomoe 2 (bottom-left) */}
      <path
        d="M8.1 14 C8.1 13.2 9 12.5 9.5 13.2 C10 14.2 8.8 14.8 8.1 14Z"
        fill="currentColor"
        opacity={0.65}
      />
      <circle cx="8.5" cy="14" r="0.6" fill="currentColor" opacity={0.65} />
      {/* Tomoe 3 (bottom-right) */}
      <path
        d="M15.9 14 C15.9 13.2 15 12.5 14.5 13.2 C14 14.2 15.2 14.8 15.9 14Z"
        fill="currentColor"
        opacity={0.65}
      />
      <circle cx="15.5" cy="14" r="0.6" fill="currentColor" opacity={0.65} />
      {/* Connecting arcs from pupil to tomoe */}
      <path d="M12 10.5 C12.3 9.5 12.2 8.5 12 8" stroke="currentColor" strokeWidth={0.8} opacity={0.4} />
      <path d="M10.8 13 C10 13.5 9.2 13.8 8.8 13.8" stroke="currentColor" strokeWidth={0.8} opacity={0.4} />
      <path d="M13.2 13 C14 13.5 14.8 13.8 15.2 13.8" stroke="currentColor" strokeWidth={0.8} opacity={0.4} />
    </svg>
  );
}

/** Rasengan icon — Naruto's signature spiraling chakra sphere.
 *  Bright energy sphere with visible spiral rotation lines and
 *  a cupped hand underneath. THE most iconic jutsu in the series.
 *  Used for Play vs AI section. */
export function HandSealIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Outer energy aura */}
      <circle cx="12" cy="9.5" r="9" fill="currentColor" opacity={0.05} />
      {/* Sphere — main orb */}
      <circle cx="12" cy="9.5" r="6.5" fill="currentColor" opacity={0.12} stroke="currentColor" strokeWidth={1.6} />
      {/* Inner ring — visible rotation boundary */}
      <circle cx="12" cy="9.5" r="4" stroke="currentColor" strokeWidth={1} opacity={0.3} />
      {/* Spiral energy — tight inward spiral showing rotation */}
      <path
        d="M12 3.5 C16 4 18 7 17.5 10.5 C17 14 14 16 11 15.5 C8.5 15 6.5 12.5 7 10 C7.5 8 9.5 6.5 11.5 7 C13 7.5 14 9 13.5 10.5 C13 11.8 11.5 12.5 10.5 12 C9.8 11.5 9.5 10.5 10 9.5 C10.5 9 11.2 8.8 11.8 9.2"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
      {/* Bright hot core */}
      <circle cx="12" cy="9.5" r="1.8" fill="currentColor" opacity={0.35} />
      <circle cx="12" cy="9.5" r="0.7" fill="currentColor" opacity={0.5} />
      {/* Cupped hand below — simplified open palm */}
      <path
        d="M7.5 17 C7.5 15.8 8.5 15.5 9.5 16 L10.5 16.5 L12 16 L13.5 16.5 L14.5 16 C15.5 15.5 16.5 15.8 16.5 17 L16 19.5 C15.5 21 14 22 12 22 C10 22 8.5 21 8 19.5 Z"
        fill="currentColor"
        opacity={0.1}
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      {/* Finger lines */}
      <path d="M9.5 16 L9.5 17.5" stroke="currentColor" strokeWidth={0.6} opacity={0.2} />
      <path d="M14.5 16 L14.5 17.5" stroke="currentColor" strokeWidth={0.6} opacity={0.2} />
    </svg>
  );
}

/** Mission points icon — scroll/medal symbol */
export function MissionPointsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
    >
      {/* Hexagonal medal */}
      <path
        d="M12 2l4 3v5l-4 3-4-3V5l4-3Z"
        fill="currentColor"
        opacity={0.3}
      />
      <path
        d="M12 2l4 3v5l-4 3-4-3V5l4-3Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Ribbon tails */}
      <path
        d="M8 13l-2 9 4-2 2 2V13M16 13l2 9-4-2-2 2V13"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
