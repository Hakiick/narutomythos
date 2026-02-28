import { useTranslations } from 'next-intl';
import { RuleSection } from '@/components/rules/RuleSection';

const RULE_SECTIONS = [
  'objective',
  'deckBuilding',
  'cardTypes',
  'zones',
  'roundFlow',
  'chakra',
  'hidden',
  'upgrade',
  'ambush',
  'missionResolution',
  'victory',
] as const;

export default function RulesPage() {
  const t = useTranslations('Rules');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {RULE_SECTIONS.map((section, i) => (
          <RuleSection
            key={section}
            title={t(`sections.${section}` as 'sections.objective')}
            content={t(`sections.${section}Content` as 'sections.objectiveContent')}
            index={i}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
