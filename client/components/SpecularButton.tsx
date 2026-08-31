'use client';

import { useRef, useEffect, type CSSProperties, type ReactNode, type MouseEventHandler } from 'react';

// Pure-CSS specular button — replaces the WebGL canvas implementation.
// Each WebGL context counts against the browser's hard limit (~8-16 total).
// With 9+ cards on screen plus GhostFibers, the oldest contexts get evicted,
// causing the background and lower buttons to go black.
// This implementation achieves the same visual using:
//   • CSS conic-gradient clamped to the border area via mask-composite: exclude
//   • --sb-angle / --sb-bright CSS custom properties updated by requestAnimationFrame

type ButtonSize = 'sm' | 'md' | 'lg';

export interface SpecularButtonProps {
  children?: ReactNode;
  size?: ButtonSize;
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-[0.85rem] px-[22px] py-[10px]',
  md: 'text-[1rem] px-[30px] py-[14px]',
  lg: 'text-[1.15rem] px-10 py-[18px]',
};

interface PropsSnap {
  intensity: number;
  shineSize: number;
  speed: number;
  followMouse: boolean;
  proximity: number;
  autoAnimate: boolean;
}

const SpecularButton = ({
  children = 'Get Started',
  size = 'lg',
  radius = 18,
  tint = '#ffffff',
  tintOpacity = 0,
  blur = 0,
  textColor = '#f5f5f5',
  lineColor = '#ffffff',
  baseColor = '#525252',
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
}: SpecularButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const propsRef = useRef<PropsSnap>({ intensity, shineSize, speed, followMouse, proximity, autoAnimate });
  propsRef.current = { intensity, shineSize, speed, followMouse, proximity, autoAnimate };

  // Arc width in degrees — derived from shineSize (matching the old shader's shineSize param)
  const arcDeg = Math.max(20, shineSize * 4);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    let angleDeg = 137;
    let idleAngle = 137;
    let pointerAngle: number | null = null;
    let proximityT = 0;
    let bright = 0;
    let last = performance.now();
    let raf = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.hypot(dx, dy);
      pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx) * (180 / Math.PI);
      const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1));
      proximityT = t * t * (3 - 2 * t);
    };
    window.addEventListener('pointermove', onPointerMove as EventListener);

    const update = (now: number) => {
      raf = requestAnimationFrame(update);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = propsRef.current;

      idleAngle += p.speed * dt * 57.3;
      const target = p.followMouse && pointerAngle != null ? pointerAngle : idleAngle;
      const diff = ((target - angleDeg + 540) % 360) - 180;
      angleDeg += diff * (1 - Math.exp(-dt * 7));

      const brightTarget = p.autoAnimate ? 1 : proximityT;
      bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));

      btn.style.setProperty('--sb-angle', `${angleDeg}deg`);
      btn.style.setProperty('--sb-bright', String(Math.min(bright * p.intensity, 1)));
    };
    raf = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove as EventListener);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative m-0 inline-flex cursor-pointer items-center justify-center font-medium leading-none tracking-[0.01em] outline-none transition-transform duration-150 active:scale-[0.97] disabled:cursor-default disabled:opacity-55 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-[3px] ${SIZES[size] || SIZES.md}${className ? ` ${className}` : ''}`}
      style={
        {
          color: textColor,
          borderRadius: `${radius}px`,
          border: 'none',
          background: `color-mix(in srgb, ${tint} calc(${tintOpacity} * 100%), transparent)`,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)',
          '--sb-angle': '137deg',
          '--sb-bright': '0',
        } as CSSProperties
      }
    >
      {/* Static hairline border — always visible at low opacity */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${radius}px`,
          border: `${thickness}px solid rgba(255,255,255,0.10)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Specular shine — conic-gradient masked to border area only */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: `-${thickness}px`,
          borderRadius: `${radius + thickness}px`,
          padding: `${thickness}px`,
          background: `conic-gradient(
            from var(--sb-angle),
            transparent 0deg,
            ${lineColor} ${arcDeg / 2}deg,
            transparent ${arcDeg}deg,
            transparent 360deg
          )`,
          // Mask out the interior — only the border ring stays visible
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          opacity: 'var(--sb-bright)',
          pointerEvents: 'none',
          zIndex: 2,
          transition: 'none',
        }}
      />

      <span style={{ position: 'relative', zIndex: 3 }}>{children}</span>
    </button>
  );
};

export default SpecularButton;
