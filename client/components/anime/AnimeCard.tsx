'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export interface AnimeCardProps {
  title: string;
  imageUrl: string;
  latestEpisode: number;
  actionText: string;
  onAction: () => void;
  isLoadingAction: boolean;
}

export default function AnimeCard({
  title,
  imageUrl,
  latestEpisode,
  actionText,
  onAction,
  isLoadingAction,
}: AnimeCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden font-mono transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_28px_rgba(52,55,160,0.35),0_20px_40px_rgba(0,0,0,0.5)]">

      {/* ── Cover image ──────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        {/* bottom gradient so text is always legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* episode badge */}
        <span className="absolute top-3 left-3 rounded-lg border border-white/15 bg-black/60 backdrop-blur-md px-2.5 py-1 text-[0.65rem] font-semibold text-white/70 tracking-[0.15em] uppercase">
          EP {latestEpisode}
        </span>
      </div>

      {/* ── Info + action ────────────────────────────── */}
      <div className="p-4 flex flex-col gap-3">
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
