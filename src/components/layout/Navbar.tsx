'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import {
  KonohaIcon,
  ScrollIcon,
  DeckIcon,
  CollectionIcon,
  SharinganIcon,
  RyoIcon,
  NewsScrollIcon,
  HeadbandIcon,
  HandSealIcon,
  JutsuBookIcon,
} from '@/components/game/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const t = useTranslations('Common');
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/cards' as const, label: t('cards'), Icon: ScrollIcon },
    { href: '/decks' as const, label: t('decks'), Icon: DeckIcon },
    { href: '/collection' as const, label: t('collection'), Icon: CollectionIcon },
    { href: '/scanner' as const, label: t('scanner'), Icon: SharinganIcon },
    { href: '/pricing' as const, label: t('pricing'), Icon: RyoIcon },
    { href: '/news' as const, label: t('news'), Icon: NewsScrollIcon },
    { href: '/events' as const, label: t('events'), Icon: HeadbandIcon },
    { href: '/play' as const, label: t('play'), Icon: HandSealIcon },
    { href: '/rules' as const, label: t('rules'), Icon: JutsuBookIcon },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="mx-auto flex items-center gap-4 px-4 py-2">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold text-primary">
          <KonohaIcon className="h-8 w-8" />
          {t('appName')}
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 whitespace-nowrap text-xs font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <link.Icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}

          {/* Locale switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs">
            <Link href={pathname} locale="en" className="px-1 hover:text-primary">
              EN
            </Link>
            <span className="text-border">|</span>
            <Link href={pathname} locale="fr" className="px-1 hover:text-primary">
              FR
            </Link>
          </div>

          {/* Auth */}
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <span className="text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    {session.user.name && (
                      <p className="text-sm font-medium">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/signin">
                <LogIn className="h-4 w-4" />
                {t('signIn')}
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium ${
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.Icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 text-xs">
              <Link href={pathname} locale="en" className="hover:text-primary">
                EN
              </Link>
              <span className="text-border">|</span>
              <Link href={pathname} locale="fr" className="hover:text-primary">
                FR
              </Link>
            </div>

            {/* Mobile auth */}
            <div className="border-t border-border pt-4">
              {session?.user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('signOut')}
                  </Button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-2 text-sm font-medium text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" />
                  {t('signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
