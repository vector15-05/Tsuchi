'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/src/lib/authClient';
import apiClient from '@/src/lib/apiClient';
import AnimeCard from '@/components/anime/AnimeCard';
import { Button } from '@/components/ui/Button';

interface Subscription {
  id: string | number;
  title: string;
  coverImage: string;
  latestEpisode: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-white/10" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/3 rounded bg-white/10" />
        <div className="h-9 w-full rounded-xl bg-white/10 mt-1" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState<Set<string | number>>(new Set());

  // Auth guard — wait for session to resolve before redirecting
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/login');
    }
  }, [isPending, session, router]);

  // Fetch subscriptions
  useEffect(() => {
    if (!session?.user) return;
    apiClient
      .get<Subscription[]>('/user/subscriptions')
      .then(res => setSubs(res.data))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  }, [session]);

  const handleDrop = async (id: string | number) => {
    setDropping(prev => new Set(prev).add(id));
    try {
      await apiClient.delete('/subscribe', { data: { animeId: id } });
      // Optimistic removal — no page refresh needed
      setSubs(prev => prev.filter(s => s.id !== id));
    } catch {
      // silently fail — real app would toast here
    } finally {
      setDropping(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // Still resolving session
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono">
        <p className="text-white/30 tracking-[0.3em] uppercase text-xs animate-pulse">
          Authenticating…
        </p>
      </div>
    );
  }

  // Not logged in — redirect already triggered, render nothing
  if (!session?.user) return null;

  return (
    <div className="w-full font-mono">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="px-6 pt-12 pb-8 max-w-7xl mx-auto">
        <p className="text-[0.65rem] tracking-[0.4em] text-white/30 uppercase mb-2">
          Radar
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Your Subscriptions
        </h1>
        <p className="mt-2 text-sm text-white/40 tracking-wide">
          {session.user.email}
        </p>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main className="px-6 pb-24 max-w-7xl mx-auto">

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && subs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-24 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl text-center px-8">
            <div className="text-4xl select-none opacity-30">📡</div>
            <div>
              <p className="text-white font-bold tracking-widest uppercase text-sm">
                Empty Radar
              </p>
              <p className="text-white/40 text-xs tracking-wide mt-2 max-w-xs">
                You haven&apos;t subscribed to any airing anime yet.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              radius={12}
              className="font-mono tracking-widest text-xs"
              onClick={() => router.push('/')}
            >
              BROWSE AIRING ANIME
            </Button>
          </div>
        )}

        {/* Subscription grid */}
        {!loading && subs.length > 0 && (
          <>
            <p className="text-[0.65rem] text-white/30 tracking-[0.3em] uppercase mb-5">
              {subs.length} {subs.length === 1 ? 'Series' : 'Series'} Tracked
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {subs.map(s => (
                <AnimeCard
                  key={s.id}
                  title={s.title}
                  imageUrl={s.coverImage}
                  latestEpisode={s.latestEpisode}
                  actionText={dropping.has(s.id) ? 'Dropping…' : 'Drop'}
                  onAction={() => handleDrop(s.id)}
                  isLoadingAction={dropping.has(s.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
