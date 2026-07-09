'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const REASON_MESSAGES: Record<string, string> = {
  no_profile: 'No encontramos tu perfil en el sistema.',
  no_discord_id: 'No pudimos vincular tu cuenta de Discord.',
  discord_api_error: 'Error al verificar tu membresía en Discord.',
  not_member: 'No sos miembro del servidor de Discord de Evoluciona.',
  profile_error: 'Error al crear o actualizar tu perfil.',
};

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const message = reason
    ? (REASON_MESSAGES[reason] ?? `Acceso denegado (${reason})`)
    : 'No tenés permiso para acceder a este recurso.';

  return (
    <main className="login-shell">
      <div className="login-shell__inner text-center space-y-6 px-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Acceso no autorizado
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base break-words">{message}</p>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/login">Volver al login</Link>
        </Button>
      </div>
    </main>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <main className="login-shell">
          <p className="text-muted-foreground">Cargando...</p>
        </main>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
