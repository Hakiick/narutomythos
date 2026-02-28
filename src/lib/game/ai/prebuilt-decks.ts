// =============================================
// Pre-built Decks for AI and Quick Play
// Uses actual card IDs from KS (Konoha Shido) set
// =============================================

export interface PrebuiltDeck {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  cardIds: string[];
  missionCardIds: string[];
}

/**
 * Deck 1 — Leaf Village Aggro
 *
 * Strategy: Fast, low-cost Leaf Village characters with high power-to-cost ratio.
 * Rush down missions early with Team 7 and Team Guy synergies.
 * 30 cards (max 2 copies each), 3 missions.
 */
const leafVillageAggro: PrebuiltDeck = {
  id: 'leaf-aggro',
  nameEn: 'Leaf Village Aggro',
  nameFr: 'Village de Konoha Aggro',
  descriptionEn: 'Fast and aggressive deck with low-cost Leaf Village ninjas. Rush power to win missions early.',
  descriptionFr: 'Deck rapide et agressif avec des ninjas du Village de Konoha a faible cout. Puissance rapide pour gagner les missions.',
  cardIds: [
    // 2x Naruto Uzumaki — Genin (cost 2, power 3)
    'KS-009', 'KS-009',
    // 2x Sasuke Uchiha — Last of the Uchiha Clan (cost 2, power 4)
    'KS-013', 'KS-013',
    // 2x Sakura Haruno — Genin (cost 2, power 2, draw synergy)
    'KS-011', 'KS-011',
    // 2x Rock Lee — Training in Ferocious Fist (cost 2, power 3, AMBUSH Powerup 1)
    'KS-038', 'KS-038',
    // 2x Tenten — Genin of Team Guy (cost 1, power 2)
    'KS-040', 'KS-040',
    // 2x Kakashi Hatake — Teacher of Team 7 (cost 3, power 3, Team 7 +1 Power)
    'KS-015', 'KS-015',
    // 2x Might Guy — Teacher of Team Guy (cost 3, power 3, Team Guy +1 Power)
    'KS-042', 'KS-042',
    // 2x Neji Hyuga — Gentle Fist (cost 2, power 2, remove power tokens)
    'KS-036', 'KS-036',
    // 2x Choji Akimichi — Expansion Jutsu (cost 2, power 1, Powerup 3)
    'KS-017', 'KS-017',
    // 2x Hiruzen Sarutobi — The Professor (cost 3, power 3, Powerup 2 friendly)
    'KS-001', 'KS-001',
    // 2x Naruto Uzumaki — "I won't run away!" (cost 4, power 5)
    'KS-108', 'KS-108',
    // 2x Sasuke Uchiha — Sharingan (cost 3, power 4, AMBUSH look at hand)
    'KS-014', 'KS-014',
    // 1x Rock Lee — Primary Lotus (cost 4, power 4, keeps power tokens)
    'KS-039',
    // 1x Might Guy — Ferocious Fist (cost 4, power 4, keeps power tokens + Powerup 3)
    'KS-043',
    // 1x Kakashi Hatake — Sharingan (cost 4, power 4, copy effect)
    'KS-016',
    // 1x Naruto Uzumaki — Substitution Jutsu (cost 3, power 3, AMBUSH move)
    'KS-010',
    // 1x Tenten — Weapon Specialist (cost 3, power 3, defeat hidden + Powerup)
    'KS-041',
    // 1x Ino Yamanaka — Genin of Team 10 (cost 1, power 1, cheap body)
    'KS-019',
  ],
  missionCardIds: [
    'KS-M01', // Call for Support — SCORE Powerup 2
    'KS-M06', // Rescue a Friend — SCORE Draw 1
    'KS-M02', // Chunin Exam — all +1 Power
  ],
};

/**
 * Deck 2 — Sound Village Control
 *
 * Strategy: Sound Village + Sound Four characters. Control the board with
 * AMBUSH effects, hiding enemy characters, and high-power finishers.
 * 30 cards (max 2 copies each), 3 missions.
 */
const soundVillageControl: PrebuiltDeck = {
  id: 'sound-control',
  nameEn: 'Sound Village Control',
  nameFr: 'Village du Son Controle',
  descriptionEn: 'Control deck using Sound Village ninjas. Hide and defeat enemies while building board presence.',
  descriptionFr: 'Deck de controle avec les ninjas du Village du Son. Cachez et eliminez les ennemis.',
  cardIds: [
    // 2x Kin Tsuchi — Kunoichi (cost 1, power 3, great value)
    'KS-072', 'KS-072',
    // 2x Jirobo — Bearer of the Curse Mark (cost 2, power 2, Sound Four synergy Powerup)
    'KS-057', 'KS-057',
    // 2x Tayuya — Bearer of the Curse Mark (cost 2, power 1, Chakra +X)
    'KS-064', 'KS-064',
    // 2x Zaku Abumi — Overconfident Shinobi (cost 2, power 4)
    'KS-070', 'KS-070',
    // 2x Dosu Kinuta — Superhuman Hearing (cost 3, power 3)
    'KS-068', 'KS-068',
    // 2x Kabuto Yakushi — Infiltrator (cost 3, power 3, AMBUSH draw)
    'KS-052', 'KS-052',
    // 2x Kimimaro — Camelia Dance (cost 3, power 3, AMBUSH hide)
    'KS-055', 'KS-055',
    // 2x Sakon — Bearer of the Curse Mark (cost 3, power 2, draw X)
    'KS-061', 'KS-061',
    // 2x Orochimaru — Undercover (cost 4, power 4, AMBUSH take control)
    'KS-050', 'KS-050',
    // 2x Kidomaru — Spiral Spider Web (cost 4, power 4, move + AMBUSH defeat)
    'KS-060', 'KS-060',
    // 2x Kimimaro — Shikotsumyaku (cost 4, power 6, excellent power)
    'KS-056', 'KS-056',
    // 2x Kabuto Yakushi — Yin Healing (cost 4, power 4, play from discard)
    'KS-053', 'KS-053',
    // 1x Tayuya — Demon Flute (cost 4, power 4, AMBUSH Powerup 2)
    'KS-065',
    // 1x Orochimaru — Orochimaru Style (cost 5, power 5)
    'KS-051',
    // 1x Ukon — Molecular Possession (cost 5, power 6, upgrade over any Sound)
    'KS-063',
    // 1x Kabuto Yakushi — Nirvana Temple (cost 5, power 5, hide all weaker)
    'KS-054',
    // 1x Orochimaru — Forbidden Jutsu (cost 6, power 7, finisher)
    'KS-106',
    // 1x Kidomaru — Bearer of the Curse Mark (cost 3, power 2, move X)
    'KS-059',
  ],
  missionCardIds: [
    'KS-M04', // Assassination — SCORE defeat hidden
    'KS-M03', // Find the Traitor — SCORE opponent discards
    'KS-M09', // Protect the Leader — 4+ Power characters get +1
  ],
};

/**
 * Deck 3 — Team Synergy
 *
 * Strategy: Mix of villages and teams, focusing on keyword synergies
 * and balanced cost curve. Includes Sand Village and Independent characters.
 * 30 cards (max 2 copies each), 3 missions.
 */
const teamSynergy: PrebuiltDeck = {
  id: 'team-synergy',
  nameEn: 'Team Synergy',
  nameFr: 'Synergie des Equipes',
  descriptionEn: 'Balanced deck mixing different villages and teams. Strong synergies and flexible strategy.',
  descriptionFr: 'Deck equilibre melangeant differents villages et equipes. Fortes synergies et strategie flexible.',
  cardIds: [
    // Sand Village core
    // 2x Gaara — Genin of the Sand Village (cost 2, power 2)
    'KS-074', 'KS-074',
    // 2x Temari — Kunoichi (cost 2, power 2)
    'KS-079', 'KS-079',
    // 2x Kankuro — Chakra Threads (cost 3, power 3)
    'KS-077', 'KS-077',
    // 2x Gaara — Sand Shield (cost 3, power 3)
    'KS-075', 'KS-075',
    // 1x Gaara — Sand Coffin (cost 4, power 4)
    'KS-120',
    // 1x Temari — Wind Scythe Jutsu (cost 5, power 5)
    'KS-121',

    // Independent powerhouses
    // 2x Haku — Orphan from the Land of Water (cost 2, power 2)
    'KS-088', 'KS-088',
    // 2x Zabuza Momochi — The Executioner's Blade (cost 3, power 5, excellent power)
    'KS-086', 'KS-086',
    // 1x Haku — Crystal Ice Mirrors (cost 4, power 2, special effect)
    'KS-089',
    // 1x Zabuza Momochi — Silent Killing (cost 5, power 6)
    'KS-087',

    // Akatsuki
    // 2x Itachi Uchiha — Akatsuki (cost 3, power 3)
    'KS-090', 'KS-090',
    // 2x Kisame Hoshigaki — Rogue Ninja (cost 3, power 4)
    'KS-092', 'KS-092',
    // 1x Itachi Uchiha — Tsukuyomi (cost 5, power 5)
    'KS-091',
    // 1x Kisame Hoshigaki — Samehada (cost 5, power 5)
    'KS-093',

    // Summons for flexibility
    // 2x Gamakichi — Eldest Son of Gamabunta (cost 2, power 3)
    'KS-096', 'KS-096',
    // 2x Gamabunta — Chief Toad (cost 3, power 6, big body)
    'KS-094', 'KS-094',
    // 2x Yashamaru — Gaara's Caretaker (cost 1, power 1, cheap body)
    'KS-084', 'KS-084',
    // 2x Baki — Council Agent (cost 3, power 2, Team Baki)
    'KS-081', 'KS-081',
  ],
  missionCardIds: [
    'KS-M06', // Rescue a Friend — SCORE Draw 1
    'KS-M01', // Call for Support — SCORE Powerup 2
    'KS-M10', // Chakra Training — Chakra +1 both
  ],
};

export const PREBUILT_DECKS: PrebuiltDeck[] = [
  leafVillageAggro,
  soundVillageControl,
  teamSynergy,
];
