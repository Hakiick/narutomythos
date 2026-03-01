'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const EFFECT_TYPES = ['MAIN', 'UPGRADE', 'AMBUSH', 'SCORE'] as const;

const EFFECT_ACTIONS = [
  { key: 'POWERUP', label: 'actionPowerup' },
  { key: 'DEFEAT', label: 'actionDefeat' },
  { key: 'HIDE', label: 'actionHide' },
  { key: 'DRAW', label: 'actionDraw' },
  { key: 'MOVE', label: 'actionMove' },
  { key: 'GAIN_CHAKRA', label: 'actionGainChakra' },
  { key: 'STEAL_CHAKRA', label: 'actionStealChakra' },
  { key: 'PROTECTION', label: 'actionProtection' },
  { key: 'POWER_BOOST', label: 'actionPowerBoost' },
  { key: 'DISCARD', label: 'actionDiscard' },
  { key: 'LOOK_AT', label: 'actionLookAt' },
  { key: 'TAKE_CONTROL', label: 'actionTakeControl' },
  { key: 'RETURN_TO_HAND', label: 'actionReturnToHand' },
  { key: 'PLAY_FROM_DISCARD', label: 'actionPlayFromDiscard' },
] as const;

interface CardFiltersProps {
  groups: string[];
  keywords: string[];
}

export function CardFilters({ groups, keywords }: CardFiltersProps) {
  const t = useTranslations('Cards');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      router.push(`${pathname}${params.toString() ? `?${params}` : ''}`);
    },
    [searchParams, router, pathname]
  );

  const updateFilterDebounced = useCallback(
    (name: string, value: string) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateFilter(name, value), 400);
    },
    [updateFilter]
  );

  const updateArrayFilter = useCallback(
    (name: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(name, values.join(','));
      } else {
        params.delete(name);
      }
      router.push(`${pathname}${params.toString() ? `?${params}` : ''}`);
    },
    [searchParams, router, pathname]
  );

  const clearFilters = () => {
    router.push(pathname);
  };

  const currentKeywords = searchParams.get('keywords')?.split(',').filter(Boolean) || [];
  const currentEffectTypes = searchParams.get('effectTypes')?.split(',').filter(Boolean) || [];
  const currentEffectActions = searchParams.get('effectActions')?.split(',').filter(Boolean) || [];

  const hasFilters =
    searchParams.has('type') ||
    searchParams.has('rarity') ||
    searchParams.has('search') ||
    searchParams.has('group') ||
    searchParams.has('chakraMin') ||
    searchParams.has('chakraMax') ||
    searchParams.has('powerMin') ||
    searchParams.has('powerMax') ||
    searchParams.has('keywords') ||
    searchParams.has('effectTypes') ||
    searchParams.has('effectActions');

  const hasAdvancedFilters =
    searchParams.has('chakraMin') ||
    searchParams.has('chakraMax') ||
    searchParams.has('powerMin') ||
    searchParams.has('powerMax') ||
    searchParams.has('keywords') ||
    searchParams.has('effectTypes') ||
    searchParams.has('effectActions');

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
          <option value="MYTHOS">{t('rarityMYTHOS')}</option>
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
            {tCommon('clearFilters')}
          </Button>
        )}
      </div>

      {/* Advanced filters toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={cn(
          'flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
          hasAdvancedFilters && 'text-primary'
        )}
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
        {showAdvanced ? t('hideAdvancedFilters') : t('showAdvancedFilters')}
      </button>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          {/* Row 1: Chakra & Power ranges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 text-xs">{t('chakraRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={8}
                  placeholder={t('min')}
                  defaultValue={searchParams.get('chakraMin') || ''}
                  onChange={(e) => updateFilterDebounced('chakraMin', e.target.value)}
                  className="w-20"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  placeholder={t('max')}
                  defaultValue={searchParams.get('chakraMax') || ''}
                  onChange={(e) => updateFilterDebounced('chakraMax', e.target.value)}
                  className="w-20"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 text-xs">{t('powerRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={9}
                  placeholder={t('min')}
                  defaultValue={searchParams.get('powerMin') || ''}
                  onChange={(e) => updateFilterDebounced('powerMin', e.target.value)}
                  className="w-20"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  min={0}
                  max={9}
                  placeholder={t('max')}
                  defaultValue={searchParams.get('powerMax') || ''}
                  onChange={(e) => updateFilterDebounced('powerMax', e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Keywords */}
          {keywords.length > 0 && (
            <div>
              <Label className="mb-1.5 text-xs">{t('keywordsFilter')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => {
                  const isSelected = currentKeywords.includes(kw);
                  return (
                    <Badge
                      key={kw}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const next = isSelected
                          ? currentKeywords.filter((k) => k !== kw)
                          : [...currentKeywords, kw];
                        updateArrayFilter('keywords', next);
                      }}
                    >
                      {kw}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: Effect Triggers */}
          <div>
            <Label className="mb-1.5 text-xs">{t('effectType')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {EFFECT_TYPES.map((et) => {
                const isSelected = currentEffectTypes.includes(et);
                const labelKey = `effect${et.charAt(0) + et.slice(1).toLowerCase()}` as 'effectMain' | 'effectUpgrade' | 'effectAmbush' | 'effectScore';
                return (
                  <Badge
                    key={et}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const next = isSelected
                        ? currentEffectTypes.filter((e) => e !== et)
                        : [...currentEffectTypes, et];
                      updateArrayFilter('effectTypes', next);
                    }}
                  >
                    {t(labelKey)}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Row 4: Effect Actions */}
          <div>
            <Label className="mb-1.5 text-xs">{t('effectAction')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {EFFECT_ACTIONS.map(({ key, label }) => {
                const isSelected = currentEffectActions.includes(key);
                return (
                  <Badge
                    key={key}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const next = isSelected
                        ? currentEffectActions.filter((a) => a !== key)
                        : [...currentEffectActions, key];
                      updateArrayFilter('effectActions', next);
                    }}
                  >
                    {t(label)}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
