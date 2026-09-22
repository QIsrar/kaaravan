import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light' | 'gold';
  showSubtitle?: boolean;
  href?: string | null;
  priority?: boolean;
}

export function Logo({
  className,
  variant = 'full',
  size = 'md',
  theme = 'light',
  showSubtitle = false,
  href = '/',
  priority = false,
}: LogoProps) {
  // Dimensions for mark
  const markSizeMap = {
    sm: { px: 28, class: 'w-7 h-7' },
    md: { px: 38, class: 'w-9 h-9 sm:w-10 sm:h-10' },
    lg: { px: 52, class: 'w-12 h-12 sm:w-14 sm:h-14' },
    xl: { px: 76, class: 'w-18 h-18 sm:w-20 sm:h-20' },
  };

  // Text sizes
  const titleSizeMap = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-xl sm:text-2xl font-bold tracking-tight',
    lg: 'text-2xl sm:text-3xl font-bold tracking-tight',
    xl: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
  };

  const subtitleSizeMap = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-xs',
  };

  // Text colors
  const textColor =
    theme === 'dark'
      ? 'text-cream'
      : theme === 'gold'
      ? 'text-gold'
      : 'text-foreground';

  const accentColor =
    theme === 'dark' ? 'text-gold' : 'text-primary';

  const markElement = (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105',
        markSizeMap[size].class
      )}
    >
      <Image
        src="/images/logo-mark.png"
        alt="Veiled Canvas Crest"
        width={markSizeMap[size].px}
        height={markSizeMap[size].px}
        priority={priority}
        className="w-full h-full object-cover select-none"
      />
    </div>
  );

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 sm:gap-3 group select-none', className)}>
      {markElement}
      {variant !== 'mark' && (
        <div className="flex flex-col">
          <span className={cn('font-heading leading-tight transition-colors', titleSizeMap[size], textColor)}>
            Veiled <span className={cn(accentColor, 'gradient-text')}>Canvas</span>
          </span>
          {showSubtitle && (
            <span
              className={cn(
                'font-sans uppercase tracking-[0.2em] font-medium text-muted-foreground transition-colors',
                subtitleSizeMap[size]
              )}
            >
              Where Modesty Meets Artistry
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
