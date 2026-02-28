'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Event } from '@prisma/client';
import { EventList } from './EventList';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PastEventsSectionProps {
  events: Event[];
}

export function PastEventsSection({ events }: PastEventsSectionProps) {
  const t = useTranslations('Events');
  const [showPast, setShowPast] = useState(false);

  return (
    <section>
      <button
        type="button"
        onClick={() => setShowPast(!showPast)}
        className="mb-6 flex items-center gap-2 text-lg font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn('h-5 w-5 transition-transform', showPast && 'rotate-180')} />
        {showPast ? t('hidePast') : t('showPast')}
        <span className="text-sm font-normal">({events.length})</span>
      </button>

      {showPast && (
        <EventList events={events} emptyMessage={t('noPast')} />
      )}
    </section>
  );
}
