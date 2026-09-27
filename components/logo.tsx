import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function LogoMark({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="AutoYard" className={cn('h-7 w-7', className)}>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path
        d="M7 25 L16 7 L25 25"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <path d="M11.5 18.5 H20.5" strokeWidth="4" strokeLinecap="round" className="stroke-chart-2" />
    </svg>
  );
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">AutoYard</span>
    </span>
  );
}
