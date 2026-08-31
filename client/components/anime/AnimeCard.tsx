'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export interface AnimeCardProps {
  title: string;
  imageUrl: string;
  latestEpisode: number;
  status?: string;
  actionText: string;
  onAction: () => void;
  isLoadingAction: boolean;
}

export default function AnimeCard({
  title,
  imageUrl,
  latestEpisode,
  status,
  actionText,
  onAction,
  isLoadingAction,
}: AnimeCardProps) {
  const hasValidImage = Boolean(imageUrl && imageUrl.trim().length > 0);
  const isFinished = status === 'Finished';

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden font-mono transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_28px_rgba(52,55,160,0.35),0_20px_40px_rgba(0,0,0,0.5)]">

      {/* ── Cover image ──────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 flex items-center justify-center">
        {hasValidImage ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-center">
            <span className="text-2xl mb-1 text-white/20">📡</span>
            <span className="text-[0.65rem] text-white/40 tracking-wider uppercase font-mono">No Cover Art</span>
          </div>
        )}

        {/* bottom gradient so text is always legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* episode badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="rounded-lg border border-white/15 bg-black/60 backdrop-blur-md px-2.5 py-1 text-[0.65rem] font-semibold text-white/70 tracking-[0.15em] uppercase">
            EP {latestEpisode}
          </span>
          <span className={`rounded-lg border px-2 py-1 text-[0.6rem] font-semibold tracking-[0.1em] uppercase ${
            isFinished
              ? 'border-purple-500/30 bg-purple-950/60 text-purple-300'
              : 'border-emerald-500/30 bg-emerald-950/60 text-emerald-300'
          }`}>
            {isFinished ? 'FINISHED' : 'AIRING'}
          </span>
        </div>
      </div>

      {/* ── Info + action ────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <h2 className="text-[0.8rem] font-semibold text-white leading-snug line-clamp-2 tracking-tight">
          {title}
        </h2>

        <Button
          size="sm"
          radius={10}
          variant={actionText.toLowerCase().includes('unsub') ? 'ghost' : 'primary'}
          disabled={isLoadingAction}
          className="w-full font-mono tracking-[0.12em] text-[0.7rem]"
          onClick={onAction}
        >
          {isLoadingAction ? 'LOADING…' : actionText.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
