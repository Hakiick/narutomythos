import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onShortPress?: () => void;
  threshold?: number;
  moveThreshold?: number;
}

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

interface UseLongPressReturn {
  handlers: LongPressHandlers;
  isPressing: boolean;
}

export function useLongPress({
  onLongPress,
  onShortPress,
  threshold = 400,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isLongPressRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      setIsPressing(true);

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setIsPressing(false);
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      cancel();
      if (!isLongPressRef.current && onShortPress) {
        e.preventDefault();
        onShortPress();
      }
      isLongPressRef.current = false;
      startPosRef.current = null;
    },
    [cancel, onShortPress]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current) return;
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > moveThreshold || dy > moveThreshold) {
        cancel();
        startPosRef.current = null;
      }
    },
    [cancel, moveThreshold]
  );

  const onPointerCancel = useCallback(() => {
    cancel();
    isLongPressRef.current = false;
    startPosRef.current = null;
  }, [cancel]);

  // Prevent context menu on long press (mobile browsers)
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return {
    handlers: { onPointerDown, onPointerUp, onPointerMove, onPointerCancel, onContextMenu },
    isPressing,
  };
}
