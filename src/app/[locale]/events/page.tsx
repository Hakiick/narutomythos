import { getTranslations } from 'next-intl/server';
import { getUpcomingEvents, getPastEvents } from '@/lib/services/event-service';
import { EventList } from '@/components/events/EventList';
import { PastEventsSection } from '@/components/events/PastEventsSection';
import { PageHeroBg } from '@/components/layout/PageHeroBg';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const heroCards = [
  { id: 'KS-133', alt: 'Naruto Uzumaki — Rasengan' },
  { id: 'KS-086', alt: "Zabuza Momochi — The Executioner's Blade" },
];

export default async function EventsPage() {
  const t = await getTranslations('Events');

  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <div>
      <PageHeroBg title={t('title')} subtitle={t('subtitle')} cards={heroCards}>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <a href="https://topdeck.gg/naruto-mythos-tcg" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t('findOnTopdeck')}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="https://topdeck.gg/op-application/naruto" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t('hostEvents')}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="https://narutotcgmythos.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t('officialSite')}
            </a>
          </Button>
        </div>
      </PageHeroBg>
      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">{t('upcoming')}</h2>
          <EventList events={upcoming} emptyMessage={t('noUpcoming')} />
        </section>

        {/* Past Events */}
        {past.length > 0 && (
          <PastEventsSection events={past} />
        )}
      </div>
    </div>
  );
}
