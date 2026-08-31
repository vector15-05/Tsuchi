import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import GhostFibers from '@/components/GhostFibers';
import Navbar from '@/components/Navbar';

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tsuchi | Anime Notifications',
  description: 'Cinematic, real-time anime release tracking.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="relative min-h-screen bg-black text-white font-mono flex flex-col">

        {/* ── Fixed WebGL fiber background ─────────────────── */}
        <div className="fixed inset-0 -z-10">
          <GhostFibers
            lineColor="#350e21"
            glowColor="#3437A0"
            speed={0.2}
            scale={2}
            rotation={0}
            rotationSpeed={0.25}
            layers={4}
            waveAmplitude={0.015}
            waveFrequency={3}
            waveSpeed={0.15}
            layerSpeed={0.08}
            twist={0.1}
            twistFrequency={5}
            twistSpeed={1.2}
            lineFrequency={5}
            lineSpacing={2}
            lineSharpness={16}
            glowFalloff={10}
            glowIntensity={1.6}
            brightness={2}
            blueBoost={1.25}
            vignette={0.8}
            grain={0.05}
            dpr={1}
          />
        </div>

        {/* ── Navbar ───────────────────────────────────────── */}
        <Navbar />

        {/* ── Page content ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>

      </body>
    </html>
  );
}
