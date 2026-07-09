'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddResourceDialog } from '@/components/add-resource-dialog';
import { BrandLockup } from '@/components/brand-logo';
import { signOut } from '@/lib/api';
import type { Profile } from '@/types';

function UserChip({ profile }: { profile: Profile }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt=""
          width={36}
          height={36}
          className="rounded-full shrink-0 size-9 ring-2 ring-border/60"
        />
      ) : (
        <div
          className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-border/60"
          aria-hidden
        >
          {profile.username.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 hidden min-[400px]:block">
        <p className="text-sm font-bold leading-none truncate max-w-[9rem] sm:max-w-[12rem]">
          {profile.username}
        </p>
        <Badge variant="secondary" className="text-[0.65rem] mt-1 font-semibold h-5 px-1.5">
          {profile.role_name}
        </Badge>
      </div>
    </div>
  );
}

export function HubHeader({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <header className="border-b border-border/60 pb-4 mb-6 sm:mb-8">
      {/* Desktop / tablet: una sola barra */}
      <div className="hidden md:flex items-center gap-6 min-h-[3.25rem]">
        <Link
          href="/"
          className="shrink-0 hover:opacity-90 transition-opacity"
        >
          <BrandLockup priority />
        </Link>

        <div className="flex-1" aria-hidden />

        {profile.can_edit && (
          <nav
            aria-label="Acciones del hub"
            className="flex items-center gap-2 shrink-0"
          >
            <Button variant="outline" size="sm" className="font-semibold" asChild>
              <Link href="/analytics">
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Analytics
              </Link>
            </Button>
            <AddResourceDialog />
          </nav>
        )}

        <div
          className="flex items-center gap-1 shrink-0 pl-4 ml-1 border-l border-border/60"
          aria-label="Tu cuenta"
        >
          <UserChip profile={profile} />
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            title="Cerrar sesión"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Móvil: marca arriba, herramientas y cuenta abajo */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="min-w-0 flex-1 hover:opacity-90 transition-opacity"
          >
            <BrandLockup priority />
          </Link>

          <div className="flex items-center gap-0.5 shrink-0">
            <UserChip profile={profile} />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              title="Cerrar sesión"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {profile.can_edit && (
          <nav
            aria-label="Acciones del hub"
            className="grid grid-cols-2 gap-2"
          >
            <Button variant="outline" size="sm" className="font-semibold w-full" asChild>
              <Link href="/analytics">
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Analytics
              </Link>
            </Button>
            <div className="[&_button]:w-full [&_button]:font-semibold">
              <AddResourceDialog />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
