'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/src/lib/authClient';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 backdrop-blur-xl font-mono">
      {/* Brand */}
      <Link
        href="/"
        className="text-base font-black tracking-[0.25em] text-white drop-shadow-[0_0_10px_rgba(180,30,60,0.7)] hover:drop-shadow-[0_0_14px_rgba(180,30,60,0.9)] transition-all"
      >
        TSUCHI
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden sm:block text-[0.7rem] text-white/35 tracking-widest truncate max-w-[180px]">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              radius={10}
              className="font-mono tracking-widest text-xs"
              onClick={() => router.push('/dashboard')}
            >
              DASHBOARD
            </Button>
            <Button
              variant="ghost"
              size="sm"
              radius={10}
              className="font-mono tracking-widest text-xs"
              onClick={handleSignOut}
            >
              SIGN OUT
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            radius={10}
            className="font-mono tracking-widest text-xs"
            onClick={() => router.push('/login')}
          >
            SIGN UP/IN
          </Button>
        )}
      </div>
    </nav>
  );
}
