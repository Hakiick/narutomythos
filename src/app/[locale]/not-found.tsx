import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('Error');

  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-2 text-2xl font-bold">{t('notFoundTitle')}</h2>
      <p className="mb-6 text-muted-foreground">{t('notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </div>
  );
}
