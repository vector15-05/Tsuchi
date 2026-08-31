'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
  size?: number;
}

export default function LoadingSpinner({
  text,
  fullScreen = false,
  size = 28,
}: LoadingSpinnerProps) {
  const panel = (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl px-10 py-8">
      <Loader2
        size={size}
        className="animate-spin text-zinc-200 drop-shadow-[0_0_8px_rgba(52,55,160,0.9)]"
      />
      {text && (
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-white/40 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
        {panel}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {panel}
    </div>
  );
}
