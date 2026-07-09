'use client';

import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrandLogo, BrandTitle } from '@/components/brand-logo';
import { getDiscordLoginUrl } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured:
    'El inicio de sesión con Discord todavía no está configurado. Avisale al equipo de Evoluciona.',
  oauth_error:
    'No pudimos iniciar sesión con Discord. Intentá de nuevo en unos minutos.',
  missing_code: 'No pudimos completar el inicio de sesión. Intentá de nuevo.',
  exchange_failed: 'Error al validar la sesión con Discord.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');
  const [discordReady, setDiscordReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/status`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { discord_configured: false }))
      .then((data: { discord_configured?: boolean }) =>
        setDiscordReady(Boolean(data.discord_configured))
      )
      .catch(() => setDiscordReady(false));
  }, []);

  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? errorCode)
    : null;

  const showNotReady = discordReady === false;
  const isLoading = discordReady === null;

  function handleDiscordLogin() {
    if (!discordReady) return;
    window.location.href = getDiscordLoginUrl();
  }

  return (
    <main className="stars-bg login-shell">
      <div className="login-shell__inner auth-panel space-y-8">
        <div className="flex flex-col items-center text-center gap-4">
          <BrandLogo size="xl" priority />
          <BrandTitle
            size="large"
            subtitle="Iniciá sesión con Discord para acceder al hub de recursos."
            className="text-center [&_p]:mx-auto"
          />
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleDiscordLogin}
            size="lg"
            className="w-full font-bold h-11"
            disabled={isLoading || !discordReady}
          >
            {isLoading ? 'Verificando...' : 'Ingresar con Discord'}
          </Button>

          {showNotReady && (
            <p className="text-sm text-amber-400 text-center">
              El acceso con Discord no está disponible todavía. El administrador debe
              completar la configuración en el servidor.
            </p>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center font-medium">
          Solo miembros del Discord de Evoluciona pueden ingresar.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="stars-bg login-shell">
          <p className="text-muted-foreground">Cargando...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
