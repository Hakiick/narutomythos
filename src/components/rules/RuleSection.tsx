'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RuleSectionProps {
  title: string;
  content: string;
  index: number;
  defaultOpen?: boolean;
}

export function RuleSection({ title, content, index, defaultOpen = false }: RuleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <span className="font-semibold">{title}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-4">
          {content.split('\n').map((line, i) => {
            if (line.trim() === '') {
              return <br key={i} />;
            }
            // Handle bold markers
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className="mb-2 text-sm leading-relaxed text-muted-foreground last:mb-0">
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={j} className="font-semibold text-foreground">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                })}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
