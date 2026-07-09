'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Eye,
  Users,
  MousePointerClick,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import type { ClickRow, FavoriteRow } from '@/types';
import { Heart } from 'lucide-react';

type Range = '24h' | '7d' | '30d' | 'all';
type SortKey = 'name' | 'category' | 'type' | 'likes' | 'total' | 'unique';
type SortDir = 'asc' | 'desc';

const RANGES: Array<{ value: Range; label: string }> = [
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'all', label: 'Todo' },
];

const RESOURCE_TYPES: Array<{ value: string; label: string }> = [
  { value: 'loom', label: 'Loom' },
  { value: 'google_doc', label: 'Google Doc' },
  { value: 'google_sheet', label: 'Google Sheet' },
  { value: 'miro', label: 'Miro' },
  { value: 'notion', label: 'Notion' },
  { value: 'fathom', label: 'Fathom' },
  { value: 'other', label: 'Otros' },
];

const UNIQUE_CLICK_WINDOW_MS = 7 * 60 * 60 * 1000;

type ResourceStats = {
  resourceId: string;
  name: string;
  category: string;
  resourceType: string;
  totalClicks: number;
  uniqueClicks: number;
  likes: number;
};

type UserDetail = {
  userId: string;
  username: string;
  totalClicks: number;
  uniqueResources: number;
  resourcesBreakdown: Array<{
    resourceId: string;
    name: string;
    category: string;
    clicks: number;
  }>;
  favoriteResources: Array<{
    resourceId: string;
    name: string;
    category: string;
  }>;
};

export function AnalyticsClient({
  clicks,
  favorites,
}: {
  clicks: ClickRow[];
  favorites: FavoriteRow[];
}) {
  const [range, setRange] = useState<Range>('7d');
  const [category, setCategory] = useState<string>('all');
  const [resourceType, setResourceType] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  // 1. Filtrar por rango temporal
  const clicksByRange = useMemo(() => {
    if (range === 'all') return clicks;

    const now = Date.now();
    const ranges: Record<Exclude<Range, 'all'>, number> = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = ranges[range];

    return clicks.filter((c) => new Date(c.clicked_at).getTime() >= cutoff);
  }, [clicks, range]);

  // 2. Después filtrar por categoría y tipo (filtros globales)
  const filteredClicks = useMemo(() => {
    return clicksByRange.filter((c) => {
      if (!c.resources) return false;
      if (category !== 'all' && c.resources.category !== category) return false;
      if (resourceType !== 'all' && c.resources.resource_type !== resourceType) return false;
      return true;
    });
  }, [clicksByRange, category, resourceType]);

  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      const r = fav.resources;
      if (!r) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (resourceType !== 'all' && r.resource_type !== resourceType) return false;
      return true;
    });
  }, [favorites, category, resourceType]);

  // 3. Lista única de categorías (de los recursos clickeados al menos una vez)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const c of clicksByRange) {
      if (c.resources?.category) set.add(c.resources.category);
    }
    return Array.from(set).sort();
  }, [clicksByRange]);

  // 4. Métricas globales
  const totalClicks = filteredClicks.length;
  const uniqueUsers = new Set(filteredClicks.map((c) => c.user_id)).size;
  const uniqueResources = new Set(filteredClicks.map((c) => c.resource_id)).size;

// 5. Stats por recurso (totales + únicos + likes)
  const resourceStats = useMemo<ResourceStats[]>(() => {
    const map = new Map<string, ResourceStats>();

    // Totales por recurso
    for (const c of filteredClicks) {
      if (!c.resources) continue;
      const id = c.resource_id;
      const existing = map.get(id);
      if (existing) {
        existing.totalClicks++;
      } else {
        map.set(id, {
          resourceId: id,
          name: c.resources.name,
          category: c.resources.category,
          resourceType: c.resources.resource_type,
          totalClicks: 1,
          uniqueClicks: 0,
          likes: 0,
        });
      }
    }

    // Únicos por recurso (con ventana de 7h por usuario)
    const groups = new Map<string, ClickRow[]>();
    for (const c of filteredClicks) {
      const key = c.resource_id + '|' + c.user_id;
      const arr = groups.get(key);
      if (arr) {
        arr.push(c);
      } else {
        groups.set(key, [c]);
      }
    }

    for (const [groupKey, groupClicks] of groups.entries()) {
      const sorted = groupClicks.slice().sort(
        (a, b) => new Date(a.clicked_at).getTime() - new Date(b.clicked_at).getTime()
      );

      const resourceId = groupKey.split('|')[0];
      let lastUniqueTime = 0;
      let uniques = 0;

      for (const click of sorted) {
        const t = new Date(click.clicked_at).getTime();
        if (t - lastUniqueTime >= UNIQUE_CLICK_WINDOW_MS) {
          uniques++;
          lastUniqueTime = t;
        }
      }

      const stat = map.get(resourceId);
      if (stat) stat.uniqueClicks += uniques;
    }

    // Likes = favoritos actuales (estado en vivo, no filtrados por rango de fechas)
    const likesCount = new Map<string, number>();
    for (const fav of filteredFavorites) {
      likesCount.set(
        fav.resource_id,
        (likesCount.get(fav.resource_id) ?? 0) + 1
      );
    }

    for (const [resourceId, likes] of likesCount) {
      let stat = map.get(resourceId);
      if (!stat) {
        const meta = filteredFavorites.find((f) => f.resource_id === resourceId)
          ?.resources;
        if (!meta) continue;
        stat = {
          resourceId,
          name: meta.name,
          category: meta.category,
          resourceType: meta.resource_type,
          totalClicks: 0,
          uniqueClicks: 0,
          likes: 0,
        };
        map.set(resourceId, stat);
      }
      stat.likes = likes;
    }

    for (const stat of map.values()) {
      if (!likesCount.has(stat.resourceId)) {
        stat.likes = 0;
      }
    }

    return Array.from(map.values());
  }, [filteredClicks, filteredFavorites]);

  // 6. Top 3 por totales y por únicos
  const topByTotal = useMemo(
    () => resourceStats.slice().sort((a, b) => b.totalClicks - a.totalClicks).slice(0, 3),
    [resourceStats]
  );

  const topByUnique = useMemo(
    () => resourceStats.slice().sort((a, b) => b.uniqueClicks - a.uniqueClicks).slice(0, 3),
    [resourceStats]
  );

  // 7. Tabla ordenable de todos los recursos
  const sortedResources = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return resourceStats.slice().sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'category':
          return a.category.localeCompare(b.category) * dir;
        case 'type':
          return a.resourceType.localeCompare(b.resourceType) * dir;
        case 'likes':
          return (a.likes - b.likes) * dir;
        case 'total':
          return (a.totalClicks - b.totalClicks) * dir;
        case 'unique':
          return (a.uniqueClicks - b.uniqueClicks) * dir;
      }
    });
  }, [resourceStats, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  // 8. Top usuarios (todos, no solo 10) + filtrado por buscador
// 8. Top usuarios + breakdown de recursos clickeados + sus favoritos
  const allUsers = useMemo<UserDetail[]>(() => {
    type Accum = {
      userId: string;
      username: string;
      totalClicks: number;
      resources: Map<string, { name: string; category: string; clicks: number }>;
    };
    const userStats = new Map<string, Accum>();

    for (const c of filteredClicks) {
      const userId = c.user_id;
      const username = c.profiles?.username ?? 'desconocido';
      const existing = userStats.get(userId);

      const resourceEntry = c.resources
        ? { name: c.resources.name, category: c.resources.category }
        : { name: 'Recurso desconocido', category: '-' };

      if (existing) {
        existing.totalClicks++;
        const r = existing.resources.get(c.resource_id);
        if (r) {
          r.clicks++;
        } else {
          existing.resources.set(c.resource_id, { ...resourceEntry, clicks: 1 });
        }
      } else {
        const map = new Map<string, { name: string; category: string; clicks: number }>();
        map.set(c.resource_id, { ...resourceEntry, clicks: 1 });
        userStats.set(userId, {
          userId,
          username,
          totalClicks: 1,
          resources: map,
        });
      }
    }

    // Mapa de favoritos por usuario (todos los que tiene marcados)
    const favoritesByUser = new Map<string, Set<string>>();
    for (const fav of filteredFavorites) {
      const set = favoritesByUser.get(fav.user_id);
      if (set) {
        set.add(fav.resource_id);
      } else {
        favoritesByUser.set(fav.user_id, new Set([fav.resource_id]));
      }
    }

    // Mapa para resolver datos de recursos (nombre, categoría) desde cualquier click
    const resourceInfo = new Map<string, { name: string; category: string }>();
    for (const c of clicks) {
      if (c.resources) {
        resourceInfo.set(c.resource_id, {
          name: c.resources.name,
          category: c.resources.category,
        });
      }
    }

    return Array.from(userStats.values())
      .map((u) => {
        const favIds = favoritesByUser.get(u.userId) ?? new Set();
        const favoriteResources = Array.from(favIds)
          .map((rid) => {
            const info = resourceInfo.get(rid);
            return info
              ? { resourceId: rid, name: info.name, category: info.category }
              : { resourceId: rid, name: 'Recurso desconocido', category: '-' };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        return {
          userId: u.userId,
          username: u.username,
          totalClicks: u.totalClicks,
          uniqueResources: u.resources.size,
          resourcesBreakdown: Array.from(u.resources.entries())
            .map(([resourceId, info]) => ({
              resourceId,
              name: info.name,
              category: info.category,
              clicks: info.clicks,
            }))
            .sort((a, b) => b.clicks - a.clicks),
          favoriteResources,
        };
      })
      .sort((a, b) => b.totalClicks - a.totalClicks);
  }, [filteredClicks, clicks, filteredFavorites]);
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => u.username.toLowerCase().includes(q));
  }, [allUsers, userQuery]);

  return (
    <main className="page-shell space-y-5 sm:space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:pb-6">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-0.5">
            <Link href="/" aria-label="Volver al hub">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">
              Analytics
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium">
              Métricas de uso del hub
            </p>
          </div>
        </div>

        <div className="-mx-1 px-1 overflow-x-auto pb-1">
          <div className="flex gap-1.5 w-max min-w-full sm:w-auto sm:flex-wrap">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                variant={range === r.value ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 text-xs sm:text-sm"
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Filtros globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resourceType} onValueChange={setResourceType}>
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {RESOURCE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Clicks totales</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{totalClicks}</p>
            </div>
            <MousePointerClick className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Usuarios activos</p>
              <p className="text-3xl font-bold mt-1">{uniqueUsers}</p>
            </div>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recursos vistos</p>
              <p className="text-3xl font-bold mt-1">{uniqueResources}</p>
            </div>
            <Eye className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3">Top 3 por clicks totales</h2>
          {topByTotal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos en este rango</p>
          ) : (
            <ol className="space-y-3">
              {topByTotal.map((item, i) => (
                <li key={item.resourceId} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl font-bold text-primary w-7 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {item.totalClicks} clicks
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-1">Top 3 por clicks únicos</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Clicks separados por 7+ horas del mismo usuario
          </p>
          {topByUnique.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos en este rango</p>
          ) : (
            <ol className="space-y-3">
              {topByUnique.map((item, i) => (
                <li key={item.resourceId} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl font-bold text-primary w-7 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {item.uniqueClicks} únicos
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Tabla scrolleable de todos los recursos */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold">Todos los recursos</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Click en una columna para ordenar
          </p>
        </div>

        {sortedResources.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">Sin datos en este rango</p>
        ) : (
          <div className="overflow-x-auto max-h-[min(32rem,70vh)] overflow-y-auto">
            <table className="w-full text-sm min-w-[36rem]">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr>
                  <SortableHeader label="Recurso" col="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Categoría" col="category" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Tipo" col="type" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Likes" col="likes" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHeader label="Totales" col="total" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHeader label="Únicos" col="unique" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedResources.map((r) => (
                  <tr key={r.resourceId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 max-w-70">
                      <p className="font-medium line-clamp-1">{r.name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getTypeLabel(r.resourceType)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className="inline-flex items-center gap-1 justify-end">
                        {r.likes > 0 && <Heart className="w-3 h-3 fill-primary text-primary" />}
                        {r.likes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{r.totalClicks}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.uniqueClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top usuarios con buscador */}
      <Card className="p-5">
        <h2 className="text-lg font-bold mb-3">Usuarios</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar usuario..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {userQuery ? 'No se encontraron usuarios' : 'Sin datos en este rango'}
          </p>
        ) : (
          <div className="max-h-100 overflow-y-auto space-y-2">
            {filteredUsers.map((u, i) => (
              <button
                key={u.userId}
                onClick={() => setSelectedUser(u)}
                className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                  <span className="font-medium text-sm truncate">{u.username}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs pl-9 sm:pl-0">
                  <Badge variant="secondary" className="font-normal">
                    {u.totalClicks} clicks
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {u.uniqueResources} recursos
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Modal detalle de usuario */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-lg md:max-w-2xl max-h-[min(85vh,32rem)] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Recursos vistos por {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              {selectedUser?.totalClicks} clicks totales en {selectedUser?.uniqueResources} recursos
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-6">
            {/* Sección: recursos clickeados */}
            <div>
              <h3 className="text-sm font-bold mb-2 text-muted-foreground">
                Recursos clickeados ({selectedUser?.resourcesBreakdown.length ?? 0})
              </h3>
              {selectedUser && selectedUser.resourcesBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {selectedUser.resourcesBreakdown.map((r) => (
                    <div
                      key={r.resourceId}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 ml-3">
                        {r.clicks} click{r.clicks === 1 ? '' : 's'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin clicks en este rango</p>
              )}
            </div>

            {/* Sección: recursos favoritos */}
            <div>
              <h3 className="text-sm font-bold mb-2 text-muted-foreground flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
                Favoritos ({selectedUser?.favoriteResources.length ?? 0})
              </h3>
              {selectedUser && selectedUser.favoriteResources.length > 0 ? (
                <div className="space-y-2">
                  {selectedUser.favoriteResources.map((r) => (
                    <div
                      key={r.resourceId}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </div>
                      <Heart className="w-4 h-4 fill-primary text-primary shrink-0 ml-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Este usuario no marcó favoritos</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// Helper: header ordenable
function SortableHeader({
  label,
  col,
  sortKey,
  sortDir,
  onClick,
  align = 'left',
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (col: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = sortKey === col;
  return (
    <th
      className={`px-4 py-3 text-${align} font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors`}
      onClick={() => onClick(col)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {isActive ? (
          sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        )}
      </span>
    </th>
  );
}

// Helper: label legible para tipo de recurso
function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    loom: 'Loom',
    google_doc: 'Google Doc',
    google_sheet: 'Google Sheet',
    miro: 'Miro',
    notion: 'Notion',
    fathom: 'Fathom',
    other: 'Otros',
  };
  return map[type] ?? type;
}