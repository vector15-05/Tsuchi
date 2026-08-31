'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Per-toast config ─────────────────────────────────────────────────────────

const CONFIG: Record<
  ToastType,
  { Icon: typeof CheckCircle; border: string; glow: string; iconClass: string }
> = {
  success: {
    Icon: CheckCircle,
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_18px_rgba(16,185,129,0.25)]',
    iconClass: 'text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]',
  },
  error: {
    Icon: AlertCircle,
    border: 'border-rose-500/30',
    glow: 'shadow-[0_0_18px_rgba(244,63,94,0.25)]',
    iconClass: 'text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]',
  },
  info: {
    Icon: Info,
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_18px_rgba(52,55,160,0.35)]',
    iconClass: 'text-blue-400 drop-shadow-[0_0_6px_rgba(52,55,160,0.9)]',
  },
};

// ─── Single toast card ────────────────────────────────────────────────────────

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { Icon, border, glow, iconClass } = CONFIG[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`
        group flex items-start gap-3 w-80 max-w-[92vw]
        rounded-2xl border ${border} ${glow}
        bg-black/60 backdrop-blur-2xl shadow-2xl
        px-4 py-3 font-mono
        animate-[slideUp_0.25s_ease-out]
      `}
    >
      <Icon size={17} className={`shrink-0 mt-0.5 ${iconClass}`} />
      <p className="flex-1 text-xs text-white/80 leading-relaxed tracking-wide">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 mt-0.5 text-white/25 hover:text-white/70 transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Toaster (renders the stack) ──────────────────────────────────────────────

function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end bg-transparent pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
