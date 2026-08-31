'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/src/lib/authClient';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import SpecularButton from '@/components/SpecularButton';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const res = await signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message ?? 'Sign-in failed.');
      } else {
        const res = await signUp.email({ email, password, name });
        if (res.error) throw new Error(res.error.message ?? 'Sign-up failed.');
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      {/* Glass card */}
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/60 p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-3xl font-black tracking-wider text-white drop-shadow-[0_0_14px_rgba(180,30,60,0.9)]">
            TSUCHI
          </span>
          <p className="text-white/50 text-sm tracking-widest uppercase mt-1">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Mode toggle pills */}
        <div className="flex gap-2">
          {(['signin', 'signup'] as Mode[]).map(m => (
            <SpecularButton
              key={m}
              type="button"
              size="sm"
              radius={10}
              tint={mode === m ? '#3437A0' : '#ffffff'}
              tintOpacity={mode === m ? 0.18 : 0.04}
              blur={8}
              lineColor={mode === m ? '#7eb3ff' : '#ffffff'}
              baseColor={mode === m ? '#3437A0' : '#444444'}
              intensity={mode === m ? 1.4 : 0.7}
              shineSize={15}
              shineFade={45}
              proximity={180}
              className="flex-1 font-semibold tracking-wide"
              onClick={() => { setMode(m); setError(null); }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </SpecularButton>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name — signup only */}
          <div
            className={`overflow-hidden transition-all duration-300 ${isSignup ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(52,55,160,0.35)] transition-all">
              <User className="text-white/40 shrink-0" size={17} />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required={isSignup}
                autoComplete="name"
                className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
              />
            </label>
          </div>

          {/* Email */}
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(52,55,160,0.35)] transition-all">
            <Mail className="text-white/40 shrink-0" size={17} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
          </label>

          {/* Password */}
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(52,55,160,0.35)] transition-all">
            <Lock className="text-white/40 shrink-0" size={17} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <SpecularButton
            type="submit"
            size="md"
            radius={12}
            tint="#3437A0"
            tintOpacity={0.22}
            blur={10}
            lineColor="#7eb3ff"
            baseColor="#3437A0"
            intensity={1.6}
            shineSize={12}
            shineFade={42}
            thickness={1.5}
            proximity={300}
            disabled={loading}
            className="mt-1 w-full font-bold tracking-wide"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {isSignup ? 'Creating account…' : 'Signing in…'}
              </span>
            ) : (
              isSignup ? 'Create Account' : 'Sign In'
            )}
          </SpecularButton>
        </form>

        {/* Footer toggle */}
        <p className="text-center text-xs text-white/40">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={toggle}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

      </div>
    </div>
  );
}
