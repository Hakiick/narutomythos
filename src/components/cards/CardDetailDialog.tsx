'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { rarityColors } from './CardItem';

interface CardDetailDialogProps {
  card: Card;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailDialog({ card, open, onOpenChange }: CardDetailDialogProps) {
  const t = useTranslations('Cards');
  const locale = useLocale();

  const fullName = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;
  const effect = (locale === 'fr' ? card.effectFr : card.effectEn) || card.effectEn;

  const [mainName, subtitle] = fullName.includes(' — ')
    ? fullName.split(' — ', 2)
    : [fullName, null];

  const typeLabel =
    card.type === 'CHARACTER'
      ? t('character')
      : card.type === 'MISSION'
        ? t('mission')
        : t('jutsu');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{fullName}</DialogTitle>
          <DialogDescription>{t('cardDetails')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Image */}
          <div className="flex shrink-0 justify-center md:w-2/5">
            <div
              className={cn(
                'relative w-full overflow-hidden rounded-lg bg-secondary',
                card.type === 'MISSION' ? 'aspect-[88/63]' : 'aspect-[63/88]'
              )}
            >
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={fullName}
                  fill
                  sizes="(max-width: 768px) 80vw, 300px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">
                  {card.type === 'CHARACTER'
                    ? '\u{1F977}'
                    : card.type === 'MISSION'
                      ? '\u{1F4DC}'
                      : '\u26A1'}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-4 md:w-3/5">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold">{mainName}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{card.id}</span>
              {card.set && (
                <Badge variant="outline" className="text-xs">
                  {t('set')}: {card.set}
                </Badge>
              )}
              <Badge
                className={cn(
                  'border-transparent text-xs text-white',
                  rarityColors[card.rarity] || 'bg-gray-600'
                )}
              >
                {card.rarity}
              </Badge>
            </div>

            {/* Type */}
            <Badge variant="secondary" className="w-fit text-xs uppercase">
              {typeLabel}
            </Badge>

            {/* Stats (CHARACTER only) */}
            {card.type === 'CHARACTER' && (
              <div className="flex gap-6">
                {card.chakra !== null && (
                  <div className="flex flex-col items-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2">
                    <span className="text-xs text-muted-foreground">{t('chakra')}</span>
                    <span className="text-2xl font-bold text-blue-400">{card.chakra}</span>
                  </div>
                )}
                {card.power !== null && (
                  <div className="flex flex-col items-center rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2">
                    <span className="text-xs text-muted-foreground">{t('power')}</span>
                    <span className="text-2xl font-bold text-red-400">{card.power}</span>
                  </div>
                )}
              </div>
            )}

            {/* Keywords */}
            {card.keywords.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t('keywords')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {card.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Village/Group */}
            {card.group && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t('village')}
                </p>
                <Badge variant="outline" className="text-xs">
                  {card.group}
                </Badge>
              </div>
            )}

            {/* Effect */}
            {effect && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t('effect')}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {effect}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
