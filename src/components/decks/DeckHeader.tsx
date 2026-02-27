'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { Deck } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Share2, Check, X } from 'lucide-react';

interface DeckHeaderProps {
  deck: Deck;
  isOwner: boolean;
  onUpdate: (data: { name?: string; description?: string | null; isPublic?: boolean }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function DeckHeader({ deck, isOwner, onUpdate, onDelete }: DeckHeaderProps) {
  const t = useTranslations('Decks');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || '');
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    await onUpdate({
      name: name.trim(),
      description: description.trim() || null,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteDeckConfirm'))) return;
    setDeleting(true);
    await onDelete();
    router.push('/decks');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="mb-6">
      {editing ? (
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('deckDescriptionPlaceholder')}
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
              <Check className="h-4 w-4" />
              {t('saveDeck')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setName(deck.name);
                setDescription(deck.description || '');
                setEditing(false);
              }}
            >
              <X className="h-4 w-4" />
              {t('cancel', { ns: 'Common' })}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{deck.name}</h1>
              {deck.description && (
                <p className="mt-1 text-sm text-muted-foreground">{deck.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {deck.isPublic ? t('public') : t('private')}
                </Badge>
              </div>
            </div>

            {isOwner && (
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label={t('editDeck')}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare} aria-label={t('shareDeck')}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t('deleteDeck')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
