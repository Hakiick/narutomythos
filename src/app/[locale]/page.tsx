import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import {
  KonohaIcon,
  UzumakiSpiralIcon,
  ScrollIcon,
  DeckIcon,
  CollectionIcon,
  RyoIcon,
  NewsScrollIcon,
  HeadbandIcon,
  JutsuBookIcon,
  SharinganIcon,
  HandSealIcon,
} from '@/components/game/icons';
import { type ComponentType } from 'react';

interface FeatureItem {
  title: string;
  description: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  iconClass: string;
  hoverBorder: string;
  hoverTitle: string;
}

export default function HomePage() {
  const t = useTranslations('Home');

  const features: FeatureItem[] = [
    {
      title: t('features.cardDatabase'),
      description: t('features.cardDatabaseDesc'),
      href: '/cards',
      Icon: ScrollIcon,
      iconClass: 'text-amber-500',
      hoverBorder: 'group-hover:border-amber-500/40',
      hoverTitle: 'group-hover:text-amber-500',
    },
    {
      title: t('features.deckBuilder'),
      description: t('features.deckBuilderDesc'),
      href: '/decks',
      Icon: DeckIcon,
      iconClass: 'text-orange-500',
      hoverBorder: 'group-hover:border-orange-500/40',
      hoverTitle: 'group-hover:text-orange-500',
    },
    {
      title: t('features.collectionManager'),
      description: t('features.collectionManagerDesc'),
      href: '/collection',
      Icon: CollectionIcon,
      iconClass: 'text-emerald-500',
      hoverBorder: 'group-hover:border-emerald-500/40',
      hoverTitle: 'group-hover:text-emerald-500',
    },
    {
      title: t('features.pricing'),
      description: t('features.pricingDesc'),
      href: '/pricing',
      Icon: RyoIcon,
      iconClass: 'text-yellow-500',
      hoverBorder: 'group-hover:border-yellow-500/40',
      hoverTitle: 'group-hover:text-yellow-500',
    },
    {
      title: t('features.news'),
      description: t('features.newsDesc'),
      href: '/news',
      Icon: NewsScrollIcon,
      iconClass: 'text-sky-500',
      hoverBorder: 'group-hover:border-sky-500/40',
      hoverTitle: 'group-hover:text-sky-500',
    },
    {
      title: t('features.organizedPlay'),
      description: t('features.organizedPlayDesc'),
      href: '/events',
      Icon: HeadbandIcon,
      iconClass: 'text-violet-500',
      hoverBorder: 'group-hover:border-violet-500/40',
      hoverTitle: 'group-hover:text-violet-500',
    },
    {
      title: t('features.rulebook'),
      description: t('features.rulebookDesc'),
      href: '/rules',
      Icon: JutsuBookIcon,
      iconClass: 'text-red-500',
      hoverBorder: 'group-hover:border-red-500/40',
      hoverTitle: 'group-hover:text-red-500',
    },
    {
      title: t('features.scanner'),
      description: t('features.scannerDesc'),
      href: '/scanner',
      Icon: SharinganIcon,
      iconClass: 'text-red-600',
      hoverBorder: 'group-hover:border-red-600/40',
      hoverTitle: 'group-hover:text-red-600',
    },
    {
      title: t('features.play'),
      description: t('features.playDesc'),
      href: '/play',
      Icon: HandSealIcon,
      iconClass: 'text-orange-400',
      hoverBorder: 'group-hover:border-orange-400/40',
      hoverTitle: 'group-hover:text-orange-400',
    },
  ];

  /* Iconic cards for hero background decoration */
  const heroCards = [
    { id: 'KS-133', alt: 'Naruto Uzumaki — Rasengan' },
    { id: 'KS-136', alt: 'Sasuke Uchiha — Heaven Curse Mark' },
    { id: 'KS-137', alt: 'Kakashi Hatake — Lightning Blade' },
  ];

  return (
    <div>
      {/* ============================================
          HERO SECTION — Cinematic Naruto atmosphere
          ============================================ */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center justify-center">
        {/* Dark base gradient + starfield */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(circle 60px at 82% 12%, rgba(255,255,240,0.07) 0%, transparent 100%)',
              'radial-gradient(circle 150px at 82% 12%, rgba(200,210,255,0.025) 0%, transparent 100%)',
              'radial-gradient(1.5px 1.5px at 8% 15%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              'radial-gradient(1px 1px at 22% 8%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              'radial-gradient(1.5px 1.5px at 38% 22%, rgba(255,255,255,0.45) 50%, transparent 100%)',
              'radial-gradient(1px 1px at 52% 5%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              'radial-gradient(1.5px 1.5px at 68% 18%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              'radial-gradient(1px 1px at 90% 25%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              'radial-gradient(0.5px 0.5px at 15% 28%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              'radial-gradient(0.5px 0.5px at 60% 10%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              'radial-gradient(ellipse 120% 100% at 50% 60%, #0a0a0a 0%, #0c1220 40%, #0f1a2e 100%)',
            ].join(', '),
          }}
        />

        {/* Uzumaki Spiral — slow rotation watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <UzumakiSpiralIcon className="w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] opacity-[0.03] text-orange-500 animate-uzumaki-spin" />
        </div>

        {/* Card art — floating behind hero content */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left card — Naruto Rasengan with animated blue energy */}
          <div className="absolute -left-8 bottom-4 sm:left-4 sm:bottom-8 w-[140px] sm:w-[180px] -rotate-12">
            <div className="relative">
              <div className="opacity-[0.12] blur-[0.5px]">
                <Image
                  src={`/storage/cards/${heroCards[0].id}.webp`}
                  alt={heroCards[0].alt}
                  width={180}
                  height={252}
                  className="rounded-lg"
                  priority
                />
              </div>
              {/* Rasengan glow — same card masked to the blue energy area */}
              <div className="animate-rasengan-card overflow-hidden rounded-lg">
                <Image
                  src={`/storage/cards/${heroCards[0].id}.webp`}
                  alt=""
                  width={180}
                  height={252}
                  className="rounded-lg"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          {/* Right card — Sasuke Chidori with animated lightning */}
          <div className="absolute -right-8 bottom-4 sm:right-4 sm:bottom-8 w-[140px] sm:w-[180px] rotate-12">
            <div className="relative">
              <div className="opacity-[0.12] blur-[0.5px]">
                <Image
                  src={`/storage/cards/${heroCards[1].id}.webp`}
                  alt={heroCards[1].alt}
                  width={180}
                  height={252}
                  className="rounded-lg"
                  priority
                />
              </div>
              {/* Chidori crackle — same card masked to the lightning area */}
              <div className="animate-chidori-card overflow-hidden rounded-lg">
                <Image
                  src={`/storage/cards/${heroCards[1].id}.webp`}
                  alt=""
                  width={180}
                  height={252}
                  className="rounded-lg"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          {/* Center card — behind title, subtle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] sm:w-[240px] opacity-[0.06] blur-[1px]">
            <Image
              src={`/storage/cards/${heroCards[2].id}.webp`}
              alt={heroCards[2].alt}
              width={240}
              height={336}
              className="rounded-lg"
              priority
            />
          </div>
        </div>

        {/* Warm orange gradient at bottom — ground glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(249,115,22,0.04) 0%, transparent 100%)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 py-20">
          {/* Tagline */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="block w-10 h-px bg-gradient-to-r from-transparent to-orange-500/50" />
            <span className="text-orange-500/70 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium">
              {t('heroTagline')}
            </span>
            <span className="block w-10 h-px bg-gradient-to-l from-transparent to-orange-500/50" />
          </div>

          <h1
            className="mb-3 text-5xl tracking-wide md:text-7xl text-foreground drop-shadow-lg"
            style={{ fontFamily: 'var(--font-naruto)' }}
          >
            {t('title')}
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground md:text-lg mb-10">
            {t('subtitle')}
          </p>

          {/* Ninja headband separator — metal plate with Konoha */}
          <div className="flex items-center justify-center gap-0">
            <span className="block flex-1 max-w-[80px] sm:max-w-[120px] h-px bg-gradient-to-r from-transparent via-zinc-600/40 to-zinc-500/50" />
            <div className="flex items-center justify-center w-11 h-11 rounded-md border border-zinc-600/40 bg-gradient-to-b from-zinc-700/50 to-zinc-800/70 shadow-lg">
              <KonohaIcon className="h-5 w-5 text-zinc-300/80" />
            </div>
            <span className="block flex-1 max-w-[80px] sm:max-w-[120px] h-px bg-gradient-to-l from-transparent via-zinc-600/40 to-zinc-500/50" />
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES GRID — 9 Naruto-themed cards
          ============================================ */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <div
                className={`h-full bg-card border border-border rounded-xl p-5 transition-all ${feature.hoverBorder}`}
              >
                <feature.Icon
                  className={`h-10 w-10 mb-3 ${feature.iconClass} transition-all`}
                />
                <h3
                  className={`text-sm font-semibold mb-1 transition-colors ${feature.hoverTitle}`}
                >
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
