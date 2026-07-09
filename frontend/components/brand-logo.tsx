import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZES = {
  header: { box: 36, img: 28 },
  sm: { box: 40, img: 32 },
  md: { box: 48, img: 38 },
  lg: { box: 64, img: 52 },
  xl: { box: 80, img: 66 },
} as const;

type BrandLogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
};

/** Logo Evoluciona: el PNG trae fondo negro; lo enmarcamos como ícono de marca. */
export function BrandLogo({
  size = 'md',
  className,
  priority = false,
}: BrandLogoProps) {
  const { box, img } = SIZES[size];

  return (
    <div
      className={cn(
        'brand-logo shrink-0 flex items-center justify-center',
        className
      )}
      style={{ width: box, height: box }}
    >
      <Image
        src="/logo/e.png"
        alt="Evoluciona"
        width={img}
        height={img}
        priority={priority}
        className="object-contain"
      />
    </div>
  );
}

type BrandTitleProps = {
  subtitle?: string;
  className?: string;
  size?: 'default' | 'large';
};

export function BrandTitle({
  subtitle,
  className,
  size = 'default',
}: BrandTitleProps) {
  return (
    <div className={cn('min-w-0 flex flex-col justify-center', className)}>
      <h1
        className={cn(
          'font-bold leading-none text-foreground',
          size === 'large'
            ? 'text-2xl sm:text-3xl'
            : 'text-lg sm:text-xl'
        )}
      >
        <span className="text-foreground">Evoluciona</span>{' '}
        <span className="text-primary">Library</span>
      </h1>
      {subtitle ? (
        <p className="text-muted-foreground text-xs font-medium mt-1.5 line-clamp-2">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Logo + título alineados en el mismo eje vertical */
export function BrandLockup({
  logoSize = 'header',
  titleSize = 'default',
  subtitle,
  className,
  priority = false,
}: {
  logoSize?: keyof typeof SIZES;
  titleSize?: 'default' | 'large';
  subtitle?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <BrandLogo size={logoSize} priority={priority} />
      <BrandTitle size={titleSize} subtitle={subtitle} />
    </div>
  );
}
