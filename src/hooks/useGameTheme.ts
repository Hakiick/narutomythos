'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import React from 'react';

export type GameTheme = 'scroll' | 'chakra' | 'konoha';

interface GameThemeContextValue {
  theme: GameTheme;
  setTheme: (theme: GameTheme) => void;
}

const STORAGE_KEY = 'naruto-mythos-game-theme';

const GameThemeContext = createContext<GameThemeContextValue>({
  theme: 'scroll',
  setTheme: () => {},
});

export function GameThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GameTheme>('scroll');

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'scroll' || stored === 'chakra' || stored === 'konoha') {
      setThemeState(stored);
    }
  }, []);

  const setTheme = useCallback((newTheme: GameTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  return React.createElement(
    GameThemeContext.Provider,
    { value: { theme, setTheme } },
    children
  );
}

export function useGameTheme(): GameThemeContextValue {
  return useContext(GameThemeContext);
}

/** CSS class for the board background per theme */
export function themeBoardClass(theme: GameTheme): string {
  switch (theme) {
    case 'scroll':
      return 'theme-scroll-bg';
    case 'chakra':
      return 'theme-chakra-bg';
    case 'konoha':
      return 'theme-konoha-bg';
  }
}

/** CSS class for mission lane styling per theme */
export function themeLaneClass(theme: GameTheme, isActive: boolean): string {
  if (!isActive) return '';
  switch (theme) {
    case 'scroll':
      return 'theme-scroll-lane-active';
    case 'chakra':
      return 'theme-chakra-lane-active';
    case 'konoha':
      return 'theme-konoha-lane-active';
  }
}

/** CSS class for the deploy effect per theme */
export function themeDeployClass(theme: GameTheme): string {
  switch (theme) {
    case 'scroll':
      return 'theme-scroll-deploy';
    case 'chakra':
      return 'theme-chakra-deploy';
    case 'konoha':
      return 'theme-konoha-deploy';
  }
}
