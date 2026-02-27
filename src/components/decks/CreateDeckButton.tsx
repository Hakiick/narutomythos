'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export function CreateDeckButton() {
  const t = useTranslations('Decks');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      if (!res.ok) return;

      const { data } = await res.json();
      router.push(`/decks/${data.slug}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4" />
        {t('newDeck')}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{t('createDeck')}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="deck-name" className="mb-1 block text-sm text-muted-foreground">
            {t('deckName')}
          </label>
          <Input
            id="deck-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('deckNamePlaceholder')}
            maxLength={100}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="deck-desc" className="mb-1 block text-sm text-muted-foreground">
            {t('deckDescription')}
          </label>
          <Input
            id="deck-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('deckDescriptionPlaceholder')}
            maxLength={500}
          />
        </div>

        <Button type="submit" disabled={!name.trim() || isSubmitting} className="w-full">
          {isSubmitting ? t('saving') : t('createDeck')}
        </Button>
      </div>
    </form>
  );
}
