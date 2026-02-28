import { useTranslations, useLocale, useFormatter } from 'next-intl';
import type { Event } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Globe, Users } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

const formatColors: Record<string, string> = {
  LOCAL: 'bg-green-600 text-white',
  REGIONAL: 'bg-blue-600 text-white',
  NATIONAL: 'bg-purple-600 text-white',
  EUROPEAN: 'bg-amber-500 text-white',
  PRERELEASE: 'bg-orange-500 text-white',
  CASUAL: 'bg-gray-500 text-white',
};

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations('Events');
  const locale = useLocale();
  const format = useFormatter();

  const name = locale === 'fr' ? event.nameFr : event.nameEn;
  const description = locale === 'fr' ? event.descriptionFr : event.descriptionEn;
  const formatLabel = t(`format${event.format}` as 'formatLOCAL');

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge className={`shrink-0 border-transparent text-xs ${formatColors[event.format] || 'bg-gray-500 text-white'}`}>
            {formatLabel}
          </Badge>
        </div>

        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>
              {format.dateTime(new Date(event.date), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {event.isOnline ? (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0" />
              <span>{t('online')}</span>
            </div>
          ) : event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {event.location}
                {event.city && `, ${event.city}`}
                {event.country && ` (${event.country})`}
              </span>
            </div>
          )}

          {event.maxPlayers && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>{t('players', { count: event.maxPlayers })}</span>
            </div>
          )}
        </div>

        {event.registrationUrl && (
          <Button asChild size="sm" className="mt-2 w-fit">
            <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
              {t('register')}
            </a>
          </Button>
        )}
      </CardHeader>
    </Card>
  );
}
