import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, CheckSquare, Clock, ListChecks } from 'lucide-react';
import { usePlatformCatalogQuery, useAddPlatformCatalog, useUpdatePlatformCatalog, useDeletePlatformCatalog } from '@/hooks/usePlatformCatalogQuery';
import type { PlatformCatalogRow } from '@/hooks/usePlatformCatalogQuery';
import { PlatformCatalogDialog } from '@/components/PlatformCatalogDialog';
import { toast } from 'sonner';

export function PlatformCatalogPage() {
  const { data: platforms = [], isLoading } = usePlatformCatalogQuery();
  const addMutation = useAddPlatformCatalog();
  const updateMutation = useUpdatePlatformCatalog();
  const deleteMutation = useDeletePlatformCatalog();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformCatalogRow | null>(null);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: PlatformCatalogRow) => { setEditing(p); setDialogOpen(true); };

  const handleSave = async (data: Omit<PlatformCatalogRow, 'id' | 'created_at'>) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...data });
        toast.success('Plataforma atualizada');
      } else {
        await addMutation.mutateAsync(data);
        toast.success('Plataforma criada');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Plataforma removida');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Carregando catálogo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo de Plataformas</h1>
          <p className="text-sm text-muted-foreground">Gerencie plataformas, checklists e regras operacionais</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Nova Plataforma
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {platforms.map(p => {
          const checklistCount = (p.checklist_obrigatorio ?? []).length;
          const bloqueantesCount = (p.checklist_obrigatorio ?? []).filter(c => c.bloqueia_passagem).length;
          return (
            <Card key={p.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(p)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Onboarding: {p.prazo_onboarding}d · Implementação: {p.prazo_implementacao}d</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">
                      {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Onboard: <strong className="text-foreground">{p.prazo_onboarding}d</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Impl: <strong className="text-foreground">{p.prazo_implementacao}d</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{checklistCount} itens no checklist</span>
                  {bloqueantesCount > 0 && (
                    <Badge variant="outline" className="text-[10px] ml-auto">{bloqueantesCount} bloqueantes</Badge>
                  )}
                </div>

                {(p.criterios_passagem ?? []).length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>{p.criterios_passagem.length} critérios de passagem</span>
                  </div>
                )}

                <div className="flex justify-end gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {p.name}?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(p.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {platforms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma plataforma cadastrada.</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Criar primeira plataforma
          </Button>
        </div>
      )}

      <PlatformCatalogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        platform={editing}
        onSave={handleSave}
        saving={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
