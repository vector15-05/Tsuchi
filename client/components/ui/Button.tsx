'use client';

import SpecularButton, { type SpecularButtonProps } from '@/components/SpecularButton';

// Thin semantic wrapper so the rest of the app imports from '@/components/ui/Button'
// and we keep one source of truth for the visual style.
export interface ButtonProps extends Omit<SpecularButtonProps, 'tint' | 'tintOpacity' | 'blur' | 'lineColor' | 'baseColor'> {
  variant?: 'primary' | 'ghost';
}

export function Button({ variant = 'primary', size = 'md', radius = 12, ...rest }: ButtonProps) {
  const primary = {
    tint: '#3437A0',
    tintOpacity: 0.22,
    blur: 10,
    lineColor: '#7eb3ff',
    baseColor: '#3437A0',
    intensity: 1.5,
    shineSize: 12,
    shineFade: 42,
    thickness: 1.5,
    proximity: 280,
  };

  const ghost = {
    tint: '#ffffff',
    tintOpacity: 0.04,
    blur: 8,
    lineColor: '#ffffff',
    baseColor: '#444444',
    intensity: 0.9,
    shineSize: 15,
    shineFade: 45,
    thickness: 1,
    proximity: 200,
  };

  return (
    <SpecularButton
      size={size}
      radius={radius}
      {...(variant === 'primary' ? primary : ghost)}
      {...rest}
    />
  );
}
