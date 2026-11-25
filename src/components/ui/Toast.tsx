import React, { useState, useEffect } from 'react';
import { Check, Info, Copy, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'copy';
}

type ToastListener = (toasts: ToastItem[]) => void;

const MAX_TOASTS = 4;
let activeToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();
const pendingTimers = new Map<string, number>();

function notify() {
  listeners.forEach((listener) => listener([...activeToasts]));
}

export const toast = {
  show: (message: string, type: 'success' | 'info' | 'copy' = 'info', duration = 2400) => {
    const id = Math.random().toString(36).slice(2, 9);
    const item: ToastItem = { id, message, type };

    // Trim oldest toast cleanly if overflowing stack limit
    if (activeToasts.length >= MAX_TOASTS) {
      const [evicted] = activeToasts;
      if (evicted) toast.dismiss(evicted.id);
    }

    activeToasts = [...activeToasts, item];
    notify();

    if (typeof window !== 'undefined') {
      const timerId = window.setTimeout(() => {
        pendingTimers.delete(id);
        activeToasts = activeToasts.filter((t) => t.id !== id);
        notify();
      }, duration);
      pendingTimers.set(id, timerId);
    }
  },
  copy: (message = 'Copied to clipboard') => {
    toast.show(message, 'copy');
  },
  info: (message: string) => {
    toast.show(message, 'info');
  },
  success: (message: string) => {
    toast.show(message, 'success');
  },
  dismiss: (id: string) => {
    const timerId = pendingTimers.get(id);
    if (timerId !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(timerId);
      pendingTimers.delete(id);
    }
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notify();
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: ToastListener = (newToasts) => setToasts(newToasts);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 bg-page border border-line text-ink text-xs shadow-2xl"
        >
          {item.type === 'copy' && <Copy className="w-3.5 h-3.5 text-accent" />}
          {item.type === 'success' && <Check className="w-3.5 h-3.5 text-accent" />}
          {item.type === 'info' && <Info className="w-3.5 h-3.5 text-muted" />}

          <span className="font-mono-tech text-[11px] font-medium">{item.message}</span>

          <button
            type="button"
            onClick={() => toast.dismiss(item.id)}
            aria-label="Dismiss notification"
            className="ml-2 text-muted hover:text-ink transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
