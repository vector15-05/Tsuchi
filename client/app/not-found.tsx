'use client';

import { useRouter } from 'next/navigation';
import { Satellite } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center px-4 bg-transparent font-mono">
      {/* Glass panel with crimson outer glow */}
      <div className="relative flex flex-col items-center gap-6 text-center rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_60px_rgba(180,30,60,0.18),0_24px_48px_rgba(0,0,0,0.6)] p-12 max-w-md w-full">

        {/* Icon */}
        <Satellite
          size={44}
          className="text-white/70 drop-shadow-[0_0_14px_rgba(180,30,60,0.9)]"
        />

        {/* Status code */}
        <div>
          <p className="text-[0.65rem] tracking-[0.4em] uppercase text-white/30 mb-2">
            Signal Lost
          </p>
          <h1 className="text-6xl font-black text-white tracking-tight leading-none">
            404
          </h1>
        </div>

        {/* Copy */}
        <p className="text-sm text-white/40 leading-relaxed tracking-wide max-w-xs">
          The broadcast you&apos;re looking for has dropped off the radar.
          It may have been moved, deleted, or never aired.
        </p>

        {/* CTA */}
        <Button
          variant="primary"
          size="md"
          radius={12}
          className="font-mono tracking-widest text-xs mt-2"
          onClick={() => router.push('/')}
        >
          RETURN TO HOMEPAGE
        </Button>
      </div>
    </div>
  );
}
