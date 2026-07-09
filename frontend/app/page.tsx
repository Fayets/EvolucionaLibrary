'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HubHeader } from '@/components/hub-header';
import { HubClient } from '@/components/hub-client';
import { getHub, ApiError } from '@/lib/api';
import { HUB_UPDATED_EVENT } from '@/lib/events';
import type { HubData } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<HubData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function loadHub(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      getHub()
        .then((hubData) => {
          if (cancelled) return;
          setData(hubData);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;

          if (err instanceof ApiError && err.status === 401) {
            router.replace('/login');
            return;
          }
          if (err instanceof ApiError && err.status === 403) {
            router.replace('/unauthorized');
            return;
          }

          setError(
            err instanceof Error ? err.message : 'Error al cargar el hub'
          );
          setLoading(false);
        });
    }

    loadHub(true);
    const onRefresh = () => loadHub(false);
    window.addEventListener(HUB_UPDATED_EVENT, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(HUB_UPDATED_EVENT, onRefresh);
    };
  }, [router]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="page-shell">
        <p className="text-destructive break-words">{error ?? 'No se pudo cargar el hub'}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Verificá que el backend FastAPI esté corriendo en{' '}
          {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}
        </p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <HubHeader profile={data.profile} />
      <HubClient resources={data.resources} canEdit={data.can_edit} />
    </main>
  );
}
