'use client';

import { useMemo, useState, useDeferredValue } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ResourceCard, type Resource } from '@/components/resource-card';
import { Search, Heart } from 'lucide-react';

const RESOURCE_TYPES: { value: string; label: string }[] = [
  { value: 'loom', label: 'Loom' },
  { value: 'google_doc', label: 'Google Doc' },
  { value: 'google_sheet', label: 'Google Sheet' },
  { value: 'miro', label: 'Miro' },
  { value: 'notion', label: 'Notion' },
  { value: 'fathom', label: 'Fathom' },
  { value: 'other', label: 'Otros' },
];
const PAGE_SIZE = 24;

export function HubClient({
  resources,
  canEdit,
}: {
  resources: Resource[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [resourceType, setResourceType] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category));
    return Array.from(set).sort();
  }, [resources]);

  const filtered = useMemo(() => {
      const q = deferredQuery.trim().toLowerCase();

      return resources.filter((r) => {
        const matchesCategory = category === 'all' || r.category === category;
        if (!matchesCategory) return false;

        const matchesType = resourceType === 'all' || r.resource_type === resourceType;
        if (!matchesType) return false;

        if (favoritesOnly && !r.is_favorite) return false;

        if (!q) return true;

        const matchesName = r.name.toLowerCase().includes(q);
        const matchesTag = r.tags.some((t) => t.toLowerCase().includes(q));
        const matchesTypeText = r.resource_type.toLowerCase().includes(q);

        
        // Sinónimos para que palabras comunes encuentren tipos
        const typeAliases: Record<string, string[]> = {
          other: ['otro', 'otros', 'link', 'enlace'],
          google_doc: ['google doc', 'docs', 'documento'],
          google_sheet: ['google sheet', 'sheet', 'sheets', 'hoja', 'planilla', 'excel'],
          loom: ['video'],
          fathom: ['video', 'reunion', 'call'],
        };

        const matchesAlias = Object.entries(typeAliases).some(([type, aliases]) =>
          r.resource_type === type && aliases.some((alias) => alias.includes(q) || q.includes(alias))
        );

        return matchesName || matchesTag || matchesTypeText || matchesAlias;
      });
    }, [resources, deferredQuery, category, resourceType, favoritesOnly]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const onQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };
  const onCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };
  const onResourceTypeChange = (value: string) => {
    setResourceType(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 min-[480px]:grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-3">
        <div className="relative min-w-0 min-[480px]:col-span-2 sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre o tag..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full min-w-0 sm:w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={resourceType} onValueChange={onResourceTypeChange}>
          <SelectTrigger className="w-full min-w-0 sm:w-40">
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
        <Button
          variant={favoritesOnly ? 'default' : 'outline'}
          size="icon"
          onClick={() => {
            setFavoritesOnly(!favoritesOnly);
            setPage(1);
          }}
          className="shrink-0 justify-self-end sm:justify-self-auto"
          aria-label={favoritesOnly ? 'Mostrar todos' : 'Mostrar solo favoritos'}
          title={favoritesOnly ? 'Mostrar todos' : 'Mostrar solo favoritos'}
        >
          <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-20 space-y-3 text-muted-foreground border rounded-lg">
          <p className="text-lg font-bold text-foreground">Todavía no hay recursos</p>
          <p className="text-sm">Cuando se agreguen recursos al hub, los vas a ver acá.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2 text-muted-foreground">
          <p className="font-bold text-foreground">Sin resultados</p>
          <p className="text-sm">Probá con otros términos o cambiá el filtro de categoría.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Mostrando {visible.length} de {filtered.length} recurso{filtered.length === 1 ? '' : 's'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 items-stretch">
            {visible.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                canEdit={canEdit}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}