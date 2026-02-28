import { getTranslations } from 'next-intl/server';
import { GameLobby } from '@/components/game/GameLobby';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Play' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function PlayPage() {
  return <GameLobby />;
}
