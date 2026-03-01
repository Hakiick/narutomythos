import { useTranslations } from 'next-intl';
import { RuleSection } from '@/components/rules/RuleSection';
import { PageHeroBg } from '@/components/layout/PageHeroBg';

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

const heroCards = [
  { id: 'KS-001', alt: 'Hiruzen Sarutobi — The Professor' },
  { id: 'KS-002', alt: 'Hiruzen Sarutobi — Third Hokage' },
];

export default function RulesPage() {
  const t = useTranslations('Rules');

  return (
    <div>
      <PageHeroBg title={t('title')} subtitle={t('subtitle')} cards={heroCards} />
      <div className="container mx-auto px-4 py-8">
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
    </div>
  );
}
