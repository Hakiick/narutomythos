'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface CardFiltersProps {
  groups: string[];
}

export function CardFilters({ groups }: CardFiltersProps) {
  const t = useTranslations('Cards');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const updateFilter = (name: string, value: string) => {
    const qs = createQueryString(name, value);
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has('type') ||
    searchParams.has('rarity') ||
    searchParams.has('search') ||
    searchParams.has('group');

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        defaultValue={searchParams.get('search') || ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:max-w-sm"
      />

      {/* Filter selects */}
      <div className="flex flex-wrap gap-3">
        {/* Type filter */}
        <select
          value={searchParams.get('type') || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t('allTypes')}</option>
          <option value="CHARACTER">{t('character')}</option>
          <option value="MISSION">{t('mission')}</option>
          <option value="JUTSU">{t('jutsu')}</option>
        </select>

        {/* Rarity filter */}
        <select
          value={searchParams.get('rarity') || ''}
          onChange={(e) => updateFilter('rarity', e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t('allRarities')}</option>
          <option value="C">Common (C)</option>
          <option value="UC">Uncommon (UC)</option>
          <option value="R">Rare (R)</option>
          <option value="AR">Art Rare (AR)</option>
          <option value="S">Super Rare (S)</option>
          <option value="L">Legendary (L)</option>
        </select>

        {/* Group filter */}
        {groups.length > 0 && (
          <select
            value={searchParams.get('group') || ''}
            onChange={(e) => updateFilter('group', e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">{t('allGroups')}</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            {t('clearFilters', { ns: 'Common' })}
          </button>
        )}
      </div>
    </div>
  );
}
