'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Swords, Check, X, LogIn, GraduationCap, Palette, Shuffle, Zap, Target, Flame, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { useGameTheme, type GameTheme } from '@/hooks/useGameTheme';
import { cn } from '@/lib/utils';

type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

const difficultyOptions: {
  id: AIDifficulty;
  nameKey: string;
  descKey: string;
  icon: typeof Zap;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: 'easy',
    nameKey: 'difficultyEasy',
    descKey: 'difficultyEasyDesc',
    icon: Zap,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    id: 'medium',
    nameKey: 'difficultyMedium',
    descKey: 'difficultyMediumDesc',
    icon: Target,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'hard',
    nameKey: 'difficultyHard',
    descKey: 'difficultyHardDesc',
    icon: Flame,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  {
    id: 'expert',
    nameKey: 'difficultyExpert',
    descKey: 'difficultyExpertDesc',
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
];

interface UserDeck {
  id: string;
  name: string;
  totalCardQuantity: number;
}

const prebuiltDecks = [
  {
    id: 'leaf-aggro',
    nameKey: 'leafAggro' as const,
    descKey: 'leafAggroDesc' as const,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  {
    id: 'sound-control',
    nameKey: 'soundControl' as const,
    descKey: 'soundControlDesc' as const,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'team-synergy',
    nameKey: 'teamSynergy' as const,
    descKey: 'teamSynergyDesc' as const,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
];

const themeOptions: { id: GameTheme; nameKey: string; descKey: string; previewClass: string; accentColor: string }[] = [
  {
    id: 'scroll',
    nameKey: 'themeScrollName',
    descKey: 'themeScrollDesc',
    previewClass: 'theme-preview-scroll',
    accentColor: 'border-yellow-700/60 text-yellow-500',
  },
  {
    id: 'chakra',
    nameKey: 'themeChakraName',
    descKey: 'themeChakraDesc',
    previewClass: 'theme-preview-chakra',
    accentColor: 'border-cyan-500/60 text-cyan-400',
  },
  {
    id: 'konoha',
    nameKey: 'themeKonohaName',
    descKey: 'themeKonohaDesc',
    previewClass: 'theme-preview-konoha',
    accentColor: 'border-green-500/60 text-green-400',
  },
];

export function GameLobby() {
  const t = useTranslations('Play');
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme: currentTheme, setTheme } = useGameTheme();
  const [userDecks, setUserDecks] = useState<UserDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDeckType, setSelectedDeckType] = useState<'user' | 'prebuilt' | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      fetch('/api/decks')
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setUserDecks(json.data);
          }
        })
        .catch(() => {
          // Silently handle — user just won't see their decks
        })
        .finally(() => setLoading(false));
    }
  }, [session?.user]);

  const handleSelectUserDeck = (deck: UserDeck) => {
    // A valid deck has 30 main cards + up to 3 missions = 30-33 total
    if (deck.totalCardQuantity < 30) return;
    setSelectedDeckId(deck.id);
    setSelectedDeckType('user');
  };

  const handleSelectPrebuilt = (deckId: string) => {
    setSelectedDeckId(deckId);
    setSelectedDeckType('prebuilt');
  };

  const handleStartGame = () => {
    if (!selectedDeckId || !selectedDeckType) return;

    sessionStorage.setItem(
      'naruto-mythos-game-deck',
      JSON.stringify({
        deckId: selectedDeckId,
        deckType: selectedDeckType,
        difficulty: selectedDifficulty,
      })
    );

    router.push('/play/game');
  };

  const handleStartTutorial = () => {
    // Use the first prebuilt deck for the tutorial
    sessionStorage.setItem(
      'naruto-mythos-game-deck',
      JSON.stringify({
        deckId: 'leaf-aggro',
        deckType: 'prebuilt',
      })
    );
    sessionStorage.setItem('naruto-mythos-tutorial', 'true');
    router.push('/play/game');
  };

  const isSelected = (id: string, type: 'user' | 'prebuilt') =>
    selectedDeckId === id && selectedDeckType === type;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Swords className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-8">
        {/* Difficulty Selector */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">{t('selectDifficulty')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {difficultyOptions.map((diff) => {
              const selected = selectedDifficulty === diff.id;
              const DiffIcon = diff.icon;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all',
                    diff.bgColor,
                    selected
                      ? `${diff.borderColor} ring-2 ring-amber-500/30`
                      : `${diff.borderColor} hover:border-primary/50`
                  )}
                >
                  <DiffIcon className={cn('h-5 w-5', diff.color)} />
                  <span className={cn('text-sm font-semibold', diff.color)}>
                    {t(diff.nameKey as 'difficultyEasy')}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {t(diff.descKey as 'difficultyEasyDesc')}
                  </span>
                  {selected && (
                    <Check className="h-4 w-4 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* User Decks Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">{t('yourDeck')}</h2>

          {status === 'loading' || loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={`skeleton-${n}`}
                  className="h-24 animate-pulse rounded-xl border border-border bg-muted"
                />
              ))}
            </div>
          ) : !session?.user ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/50 p-6">
              <p className="text-sm text-muted-foreground">
                {t('signInForDecks')}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/signin">
                  <LogIn className="h-4 w-4" />
                  {t('signInForDecks')}
                </Link>
              </Button>
            </div>
          ) : userDecks.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              {t('noDecks')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {userDecks.map((deck) => {
                const isValid = deck.totalCardQuantity >= 30;
                const selected = isSelected(deck.id, 'user');

                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => handleSelectUserDeck(deck)}
                    disabled={!isValid}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : isValid
                          ? 'border-border hover:border-primary/50'
                          : 'cursor-not-allowed border-border opacity-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{deck.name}</span>
                    <Badge
                      variant={isValid ? 'secondary' : 'destructive'}
                      className="text-[10px]"
                    >
                      {isValid ? (
                        <Check className="mr-1 h-3 w-3" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      {isValid
                        ? t('deckValid', { count: deck.totalCardQuantity })
                        : t('deckInvalid', { count: deck.totalCardQuantity })}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {t('orUsePrebuilt')}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Pre-built Decks Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">{t('prebuiltDecks')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Random Deck option */}
            <button
              type="button"
              onClick={() => handleSelectPrebuilt('random')}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors bg-zinc-500/10 border-zinc-500/30',
                isSelected('random', 'prebuilt')
                  ? 'ring-2 ring-primary/20 border-zinc-400/50'
                  : 'hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Shuffle className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-300">
                  {t('randomDeck')}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {t('randomDeckDesc')}
              </span>
            </button>
            {prebuiltDecks.map((deck) => {
              const selected = isSelected(deck.id, 'prebuilt');

              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => handleSelectPrebuilt(deck.id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${deck.bgColor} ${
                    selected
                      ? `${deck.borderColor} ring-2 ring-primary/20`
                      : `${deck.borderColor} hover:border-primary/50`
                  }`}
                >
                  <span className={`text-sm font-semibold ${deck.color}`}>
                    {t(deck.nameKey)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(deck.descKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Theme Selector */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('themeTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {themeOptions.map((opt) => {
              const selected = currentTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={`relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                    selected
                      ? `${opt.accentColor} ring-2 ring-primary/30`
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {/* Live mini-background preview */}
                  <div className={`h-20 w-full ${opt.previewClass}`} />
                  <div className="p-3 text-left">
                    <span className={`text-sm font-semibold ${selected ? opt.accentColor.split(' ')[1] : 'text-foreground'}`}>
                      {t(opt.nameKey as 'themeScrollName' | 'themeChakraName' | 'themeKonohaName')}
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(opt.descKey as 'themeScrollDesc' | 'themeChakraDesc' | 'themeKonohaDesc')}
                    </p>
                  </div>
                  {selected && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tutorial */}
        <section>
          <button
            type="button"
            onClick={handleStartTutorial}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('tutorialTitle')}</span>
              <p className="text-xs text-muted-foreground">{t('tutorialSubtitle')}</p>
            </div>
          </button>
        </section>

        {/* Start */}
        <section>
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedDeckId}
            onClick={handleStartGame}
          >
            <Swords className="h-5 w-5" />
            {selectedDeckId ? t('startGame') : t('selectDeckFirst')}
          </Button>
        </section>
      </div>
    </div>
  );
}
