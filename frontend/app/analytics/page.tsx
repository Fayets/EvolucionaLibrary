'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsClient } from '@/components/analytics-client';
import { getAnalytics, ApiError } from '@/lib/api';
import { HUB_UPDATED_EVENT } from '@/lib/events';
import type { AnalyticsData } from '@/types';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function loadAnalytics(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      getAnalytics()
        .then((analyticsData) => {
          if (cancelled) return;
          setData(analyticsData);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;

          if (err instanceof ApiError && err.status === 401) {
            router.replace('/login');
            return;
          }
          if (err instanceof ApiError && err.status === 403) {
            router.replace('/');
            return;
          }
          setError(
            err instanceof Error ? err.message : 'Error al cargar analytics'
          );
          setLoading(false);
        });
    }

    loadAnalytics(true);
    const onRefresh = () => loadAnalytics(false);
    window.addEventListener(HUB_UPDATED_EVENT, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(HUB_UPDATED_EVENT, onRefresh);
    };
  }, [router]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="text-muted-foreground">Cargando analytics...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="page-shell">
        <p className="text-destructive break-words">{error ?? 'No se pudo cargar analytics'}</p>
      </main>
    );
  }

  return <AnalyticsClient clicks={data.clicks} favorites={data.favorites} />;
}
