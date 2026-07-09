'use client';

import { useEffect, useState, useTransition } from 'react';
import { notifyHubUpdated } from '@/lib/events';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { detectResourceType } from '@/lib/icons';
import { MoreVertical, Trash2, Pencil, Heart } from 'lucide-react';
import Image from 'next/image';
import { deleteResource, toggleFavorite, recordClick } from '@/lib/api';
import { toast } from 'sonner';
import { AddResourceDialog } from '@/components/add-resource-dialog';
import type { Resource } from '@/types';

export type { Resource };

type Props = {
  resource: Resource;
  canEdit: boolean;
};

export function ResourceCard({ resource, canEdit }: Props) {
  const { iconPath, label } = detectResourceType(resource.url);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFavorite, setIsFavorite] = useState(resource.is_favorite ?? false);
  const [isFavPending, startFavTransition] = useTransition();

  useEffect(() => {
    setIsFavorite(resource.is_favorite ?? false);
  }, [resource.id, resource.is_favorite]);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteResource(resource.id);

      if (result.success) {
        toast.success('Recurso borrado');
        setConfirmOpen(false);
        notifyHubUpdated();
      } else {
        toast.error(result.error);
      }
    });
  }
  function handleToggleFavorite(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  // Optimistic update — actualizamos la UI inmediatamente
  const previousState = isFavorite;
  setIsFavorite(!previousState);

  startFavTransition(async () => {
    const result = await toggleFavorite(resource.id);

    if (result.success) {
      setIsFavorite(result.isFavorite ?? !previousState);
      notifyHubUpdated();
    } else {
      setIsFavorite(previousState);
      toast.error(result.error);
    }
  });
}
  function handleCardClick() {
  // Fire-and-forget: registra el click sin bloquear la apertura del link
  recordClick(resource.id);
}

  return (
    <>
      <Card className="h-full group relative flex flex-col gap-0 !py-3.5 !px-3.5 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 rounded-[inherit]"
          aria-label={`Abrir ${resource.name}`}
          onClick={handleCardClick}
        />

        <div className="flex items-center gap-2.5 mb-2.5 pr-11">
          <div className="shrink-0 size-8 rounded-lg bg-muted/60 flex items-center justify-center ring-1 ring-border/40">
            <Image
              src={iconPath}
              alt=""
              width={20}
              height={20}
              className="opacity-95"
            />
          </div>
          <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary ring-1 ring-primary/20">
            {resource.category}
          </span>
        </div>

        <h3 className="font-bold text-sm leading-snug line-clamp-2 text-foreground">
          {resource.name}
        </h3>

        {resource.tags.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 mt-2.5 max-h-[3rem] overflow-hidden"
            aria-label={`Etiquetas: ${resource.tags.slice(0, 4).join(', ')}`}
          >
            {resource.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-full border border-border/60',
                  'bg-muted/30 px-2 py-0.5',
                  'text-[0.6875rem] font-medium text-muted-foreground',
                  'before:content-["#"] before:mr-0.5 before:text-muted-foreground/45'
                )}
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 4 && (
              <span className="text-[0.6875rem] font-semibold text-muted-foreground/80 px-0.5 self-center">
                +{resource.tags.length - 4}
              </span>
            )}
          </div>
        )}
        {/* Botón de favorito (todos los usuarios) */}
        <button
          onClick={handleToggleFavorite}
          disabled={isFavPending}
          className={`resource-card-fav absolute top-2 ${canEdit ? 'right-10' : 'right-2'} z-20 size-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors ${isFavorite ? 'is-favorite' : ''}`}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isFavorite
                ? 'fill-primary text-primary scale-110'
                : 'text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          />
        </button>
        {/* Menú de acciones (solo si puede editar) */}
        {canEdit && (
          <div className="absolute top-2 right-2 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="resource-card-actions size-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Acciones del recurso"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </Card>

      {/* Diálogo de confirmación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por borrar <span className="font-semibold">{resource.name}</span>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Borrando...' : 'Borrar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
      {/* Modal de edición */}
      <AddResourceDialog
        resource={resource}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}