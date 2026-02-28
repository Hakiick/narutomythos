'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Swords, Check, X, LogIn, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';

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

export function GameLobby() {
  const t = useTranslations('Play');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userDecks, setUserDecks] = useState<UserDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDeckType, setSelectedDeckType] = useState<'user' | 'prebuilt' | null>(null);
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        {/* Tutorial */}
        <section>
          <button
            type="button"
            onClick={handleStartTutorial}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">{t('tutorial')}</span>
              <p className="text-xs text-muted-foreground">{t('tutorialDesc')}</p>
            </div>
          </button>
        </section>

        {/* Difficulty + Start */}
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium">{t('aiDifficulty')}</span>
            <Badge variant="secondary">{t('difficultyNormal')}</Badge>
          </div>

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
