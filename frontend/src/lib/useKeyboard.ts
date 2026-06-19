import { useEffect, useCallback } from 'react';

type Shortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  enabled?: boolean;
};

const registered: Shortcut[] = [];

const handleKey = (event: KeyboardEvent) => {
  for (const s of registered) {
    if (s.enabled === false) continue;
    const keyMatch = event.key.toLowerCase() === s.key.toLowerCase();
    const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : true;
    const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
    const metaMatch = s.meta ? event.metaKey : true;
    if (keyMatch && ctrlMatch && shiftMatch && metaMatch) {
      if (s.key === 'Escape') {
        event.preventDefault();
      }
      s.handler();
      return;
    }
  }
};

let initialized = false;

const init = () => {
  if (initialized) return;
  initialized = true;
  window.addEventListener('keydown', handleKey);
};

export const useKeyboard = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    init();
    for (const s of shortcuts) {
      registered.push(s);
    }
    return () => {
      for (const s of shortcuts) {
        const idx = registered.indexOf(s);
        if (idx !== -1) registered.splice(idx, 1);
      }
    };
  }, [shortcuts]);
};

export const useEscape = (handler: () => void, enabled = true) => {
  useKeyboard([{ key: 'Escape', handler, enabled }]);
};
