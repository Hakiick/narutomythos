import type { Event } from '@prisma/client';
import { EventCard } from './EventCard';

interface EventListProps {
  events: Event[];
  emptyMessage: string;
}

export function EventList({ events, emptyMessage }: EventListProps) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
