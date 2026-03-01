import type { Metadata } from 'next';
import { Dela_Gothic_One } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SessionProvider } from '@/components/providers/session-provider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import '@/app/globals.css';

const delaGothic = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dela-gothic',
});

type Locale = (typeof routing.locales)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Common' });

  return {
    title: {
      template: `%s | ${t('appName')}`,
      default: t('appName'),
    },
    description: 'Naruto Mythos TCG companion app',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${delaGothic.variable} min-h-screen bg-background font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 naruto-page-bg">{children}</main>
              <Footer />
            </div>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
