import { prisma } from '@/lib/prisma';
import type { Event } from '@prisma/client';

export async function getUpcomingEvents(limit = 20): Promise<Event[]> {
  return prisma.event.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    take: limit,
  });
}

export async function getPastEvents(limit = 20): Promise<Event[]> {
  return prisma.event.findMany({
    where: { date: { lt: new Date() } },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return prisma.event.findUnique({
    where: { slug },
  });
}
