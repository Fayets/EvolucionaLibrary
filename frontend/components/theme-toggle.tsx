'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  function handleToggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn(
        'fixed top-3 right-3 sm:top-4 sm:right-4 z-50 size-9 sm:size-10 rounded-full',
        'border-border/70 bg-background/85 backdrop-blur-md shadow-md',
        'transition-colors duration-200',
        'hover:bg-accent hover:text-accent-foreground hover:border-primary/30',
        'dark:bg-card/90 dark:hover:bg-accent dark:hover:text-accent-foreground',
        'focus-visible:ring-primary/40'
      )}
    >
      {mounted ? (
        isDark ? (
          <Moon className="size-[1.15rem]" strokeWidth={2} />
        ) : (
          <Sun className="size-[1.15rem]" strokeWidth={2} />
        )
      ) : (
        <span className="size-[1.15rem]" />
      )}
    </Button>
  );
}
