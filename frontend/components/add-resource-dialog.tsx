'use client';

import { useState, useTransition, useEffect } from 'react';
import { notifyHubUpdated } from '@/lib/events';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { createResource, updateResource } from '@/lib/api';
import { detectResourceType } from '@/lib/icons';
import { toast } from 'sonner';
import type { Resource } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  'Estrategia',
  'Marketing',
  'Mentalidad',
  'Producto',
  'Ventas',
] as const;
type Props = {
  resource?: Resource;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddResourceDialog({
  resource,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const isEditMode = Boolean(resource);

  // Si viene controlled (modo edición), usamos eso. Si no, manejamos estado local (modo crear)
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Cuando se abre en modo edición, pre-llenar con los datos del recurso
  useEffect(() => {
    if (open && resource) {
      setName(resource.name);
      setUrl(resource.url);
      setCategory(resource.category);
      setTags(resource.tags);
      setTagInput('');
    } else if (!open) {
      // Limpiar al cerrar
      setName('');
      setUrl('');
      setCategory('');
      setTags([]);
      setTagInput('');
    }
  }, [open, resource]);

  const detectedType = url.length > 5 ? detectResourceType(url) : null;

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    if (tags.length >= 10) {
      toast.error('Máximo 10 tags por recurso');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input = {
      name: name.trim(),
      url: url.trim(),
      category: category.trim(),
      tags,
    };

    startTransition(async () => {
      const result = isEditMode && resource
        ? await updateResource(resource.id, input)
        : await createResource(input);

      if (result.success) {
        toast.success(isEditMode ? 'Recurso actualizado' : 'Recurso agregado');
        setOpen(false);
        notifyHubUpdated();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* En modo crear, mostramos el botón. En modo editar, el padre controla la apertura */}
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar recurso
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar recurso' : 'Agregar nuevo recurso'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modificá los datos que quieras actualizar.'
              : 'Completá los datos. El nombre se guardará en mayúsculas automáticamente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Capas de negocio"
              maxLength={80}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
            {detectedType && (
              <p className="text-xs text-muted-foreground">
                Detectado como: <span className="font-medium">{detectedType.label}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Seleccioná una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (opcional)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder="Escribí y presioná Enter para agregar"
              maxLength={30}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Quitar tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Guardando...'
                : isEditMode
                ? 'Guardar cambios'
                : 'Guardar recurso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}