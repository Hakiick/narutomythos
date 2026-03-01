'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameTheme } from '@/hooks/useGameTheme';

interface DeployEffectProps {
  /** Unique key to trigger a fresh animation */
  triggerKey: string | number;
}

export function DeployEffect({ triggerKey }: DeployEffectProps) {
  const { theme } = useGameTheme();
  const [visible, setVisible] = useState(false);
  const isInitialMount = useRef(true);

  // Only trigger on key changes after the initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(timer);
  }, [triggerKey]);

  if (!visible) return null;

  let className: string;
  switch (theme) {
    case 'scroll':
      className = 'theme-scroll-deploy';
      break;
    case 'chakra':
      className = 'theme-chakra-deploy';
      break;
    case 'konoha':
      className = 'theme-konoha-deploy';
      break;
  }

  return <div className={className} aria-hidden="true" />;
}
