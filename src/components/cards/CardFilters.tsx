'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
      <Input
        type="text"
        placeholder={t('searchPlaceholder')}
        defaultValue={searchParams.get('search') || ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="sm:max-w-sm"
      />

      {/* Filter selects */}
      <div className="flex flex-wrap gap-3">
        {/* Type filter */}
        <Select
          value={searchParams.get('type') || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="w-auto"
        >
          <option value="">{t('allTypes')}</option>
          <option value="CHARACTER">{t('character')}</option>
          <option value="MISSION">{t('mission')}</option>
          <option value="JUTSU">{t('jutsu')}</option>
        </Select>

        {/* Rarity filter */}
        <Select
          value={searchParams.get('rarity') || ''}
          onChange={(e) => updateFilter('rarity', e.target.value)}
          className="w-auto"
        >
          <option value="">{t('allRarities')}</option>
          <option value="C">{t('rarityC')}</option>
          <option value="UC">{t('rarityUC')}</option>
          <option value="R">{t('rarityR')}</option>
          <option value="AR">{t('rarityAR')}</option>
          <option value="S">{t('rarityS')}</option>
          <option value="L">{t('rarityL')}</option>
        </Select>

        {/* Group filter */}
        {groups.length > 0 && (
          <Select
            value={searchParams.get('group') || ''}
            onChange={(e) => updateFilter('group', e.target.value)}
            className="w-auto"
          >
            <option value="">{t('allGroups')}</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
            {t('clearFilters', { ns: 'Common' })}
          </Button>
        )}
      </div>
    </div>
  );
}
