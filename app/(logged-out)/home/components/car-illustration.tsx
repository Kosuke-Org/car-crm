'use client';

import { type Transition, motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const palettes = {
  solid: {
    body: 'fill-primary',
    window: 'fill-accent',
    seam: 'stroke-primary-foreground/20',
    handle: 'stroke-primary-foreground/45',
    headlight: 'fill-brand-accent',
    taillight: 'fill-chart-5',
    tire: 'fill-foreground',
    rim: 'fill-muted',
    spokes: 'stroke-muted-foreground',
    hub: 'fill-foreground',
  },
  outline: {
    body: 'fill-none stroke-current',
    window: 'fill-none stroke-current',
    seam: 'stroke-current',
    handle: 'stroke-current',
    headlight: 'fill-current',
    taillight: 'fill-current',
    tire: 'fill-none stroke-current',
    rim: 'fill-none stroke-current',
    spokes: 'stroke-current',
    hub: 'fill-current',
  },
};

const wheelCenters = [70, 250];

interface CarIllustrationProps {
  variant?: keyof typeof palettes;
  wheelTransition?: Transition;
  className?: string;
}

export function CarIllustration({
  variant = 'solid',
  wheelTransition,
  className,
}: CarIllustrationProps) {
  const palette = palettes[variant];

  return (
    <svg
      viewBox="0 0 320 101"
      aria-hidden
      className={cn('h-auto w-full overflow-visible', className)}
      strokeWidth={variant === 'outline' ? 1.5 : undefined}
    >
      <path
        d="M20 88 C15 88 12 85 12 80 L12 62 C12 56 15 52 21 48.5 L55 28 C62 23.5 69 21 78 21 L174 20 C185 20 193 22.5 200 27.5 L232 52 L284 57.5 C298 59.5 308 66 308 76 L308 82 C308 86 305 88 300 88 L272.5 88 A23 23 0 1 0 227.5 88 L92.5 88 A23 23 0 1 0 47.5 88 Z"
        className={palette.body}
      />
      <path d="M38 51 L59 34 C64.5 30 70 27 78 27 L86 27 L86 51 Z" className={palette.window} />
      <path d="M93 27 L134 27 L134 51 L93 51 Z" className={palette.window} />
      <path
        d="M141 27 L173 27 C180 27 186 28.5 192 32.5 L217 51 L141 51 Z"
        className={palette.window}
      />
      <path d="M89.5 55 V85 M137.5 55 V85" strokeWidth="1.5" className={palette.seam} />
      <path
        d="M110 61 H122 M158 61 H170"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={palette.handle}
      />
      <path
        d="M286 61.5 L301 63.5 C304 64 306 66 306.5 68.5 L290 67.5 Z"
        className={palette.headlight}
      />
      <path d="M12 59 L20 57 L20 67 L12 67 Z" className={palette.taillight} />

      {wheelCenters.map((cx) => (
        <motion.g
          key={cx}
          initial={wheelTransition ? { rotate: 0 } : false}
          animate={wheelTransition ? { rotate: 1800 } : undefined}
          transition={wheelTransition}
        >
          <circle cx={cx} cy="81" r="19.5" className={palette.tire} />
          <circle cx={cx} cy="81" r="11" className={palette.rim} />
          <path
            d={`M${cx} 81 L${cx} 71 M${cx} 81 L${cx + 9.5} 77.9 M${cx} 81 L${cx + 5.9} 89.1 M${cx} 81 L${cx - 5.9} 89.1 M${cx} 81 L${cx - 9.5} 77.9`}
            strokeWidth="2.5"
            strokeLinecap="round"
            className={palette.spokes}
          />
          <circle cx={cx} cy="81" r="3.5" className={palette.hub} />
        </motion.g>
      ))}
    </svg>
  );
}
