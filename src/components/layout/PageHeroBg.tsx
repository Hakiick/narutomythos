import Image from 'next/image';

interface PageHeroBgProps {
  title: string;
  subtitle: string;
  cards: { id: string; alt: string }[];
  children?: React.ReactNode;
}

export function PageHeroBg({ title, subtitle, cards, children }: PageHeroBgProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(circle 50px at 85% 15%, rgba(255,255,240,0.05) 0%, transparent 100%)',
            'radial-gradient(circle 120px at 85% 15%, rgba(200,210,255,0.02) 0%, transparent 100%)',
            'radial-gradient(ellipse 120% 100% at 50% 60%, #0a0a0a 0%, #0c1220 40%, #0f1a2e 100%)',
          ].join(', '),
        }}
      />

      {/* Warm bottom glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(249,115,22,0.03) 0%, transparent 100%)',
        }}
      />

      {/* Card art — left */}
      {cards[0] && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 sm:left-0 w-[130px] sm:w-[180px] opacity-[0.15] -rotate-12 blur-[0.5px]">
          <Image
            src={`/storage/cards/${cards[0].id}.webp`}
            alt={cards[0].alt}
            width={180}
            height={252}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Card art — right */}
      {cards[1] && (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 sm:right-0 w-[130px] sm:w-[180px] opacity-[0.15] rotate-12 blur-[0.5px]">
          <Image
            src={`/storage/cards/${cards[1].id}.webp`}
            alt={cards[1].alt}
            width={180}
            height={252}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--color-background), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-10 pb-12">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}
