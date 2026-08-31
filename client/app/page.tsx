'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/src/lib/apiClient';
import { useSession } from '@/src/lib/authClient';
import AnimeCard from '@/components/anime/AnimeCard';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnimeItem {
  externalId: number;
  title: string;
  latestEpisode: number;
  status: string;
  imageUrl: string;
}

interface SubscriptionItem {
  id: string;
  animeId: number;
  anime: AnimeItem;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl overflow-hidden animate-pulse font-mono">
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

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const toast = useToast();

  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-card subscription state
  const [subscribing, setSubscribing] = useState<Set<number>>(new Set());
  const [subscribed, setSubscribed] = useState<Set<number>>(new Set());

  // Load all currently airing anime from the backend
  useEffect(() => {
    setLoading(true);
    apiClient
      .get<AnimeItem[]>('/anime')
      .then(res => {
        setAnimeList(res.data);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load anime list. Make sure the backend server is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch user's active subscriptions if logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setSubscribed(new Set());
      return;
    }
    apiClient
      .get<AnimeItem[]>('/user/subscriptions')
      .then(res => {
        const subscribedIds = new Set(res.data.map(anime => anime.externalId));
        setSubscribed(subscribedIds);
      })
      .catch(() => {
        // user subscription fetch failure
      });
  }, [isLoggedIn]);

  const handleSubscribeToggle = async (animeId: number, title: string) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const isSubbed = subscribed.has(animeId);
    setSubscribing(prev => new Set(prev).add(animeId));

    try {
      if (isSubbed) {
        await apiClient.delete('/unsubscribe', { data: { externalAnimeId: animeId } });
        setSubscribed(prev => {
          const next = new Set(prev);
          next.delete(animeId);
          return next;
        });
        toast(`Unsubscribed from ${title}`, 'info');
      } else {
        await apiClient.post('/subscribe', { externalAnimeId: animeId });
        setSubscribed(prev => new Set(prev).add(animeId));
        toast(`Subscribed to ${title}!`, 'success');
      }
    } catch {
      toast('Action failed. Please try again.', 'error');
    } finally {
      setSubscribing(prev => {
        const next = new Set(prev);
        next.delete(animeId);
        return next;
      });
    }
  };

  return (
    <div className="w-full font-mono">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="px-6 pt-16 pb-12 max-w-5xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] text-white/40 uppercase mb-4">Currently Airing</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Never Miss an<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
            Episode Again.
          </span>
        </h1>
        <p className="mt-4 text-sm text-white/40 tracking-wide max-w-md mx-auto leading-relaxed">
          Subscribe to airing anime and get notified the moment a new episode drops.
        </p>
      </header>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <main className="px-6 pb-24 max-w-7xl mx-auto">
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-md px-5 py-4 text-sm text-red-300 text-center tracking-wide">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            : animeList.map(a => {
                const isSubbed = subscribed.has(a.externalId);
                return (
                  <AnimeCard
                    key={a.externalId}
                    title={a.title}
                    imageUrl={a.imageUrl}
                    latestEpisode={a.latestEpisode}
                    actionText={
                      isSubbed
                        ? 'Unsubscribe'
                        : isLoggedIn
                        ? 'Subscribe'
                        : 'Sign in to Subscribe'
                    }
                    onAction={() => handleSubscribeToggle(a.externalId, a.title)}
                    isLoadingAction={subscribing.has(a.externalId)}
                  />
                );
              })}
        </div>

        {!loading && !error && animeList.length === 0 && (
          <div className="text-center py-24 text-white/30 tracking-widest uppercase text-sm">
            No airing anime found.
          </div>
        )}
      </main>
    </div>
  );
}

