import { useState, useRef, useMemo } from 'react';
import { Brain, Send, History, Upload, Eye, Trash2, FileText, User, ShoppingBag, Star, Clock, ListChecks, TrendingUp, MessageCircle, Loader2, Settings2, CheckCircle2, AlertTriangle, ArrowRight, CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Client } from '@/types';
import type { ClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { useUpdateClientPlatform } from '@/hooks/useClientPlatformsQuery';
import { usePlatformChatNotesQuery, useAddPlatformChatNote } from '@/hooks/usePlatformChatNotesQuery';
import { usePlatformChangeLogsQuery } from '@/hooks/usePlatformChangeLogsQuery';
import { usePlatformDocumentsQuery, useUploadPlatformDocument, useDeletePlatformDocument, getPlatformDocumentUrl } from '@/hooks/usePlatformDocumentsQuery';
import { usePlatformPhaseStatusesQuery } from '@/hooks/usePlatformPhaseStatusesQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useSquads } from '@/contexts/SquadsContext';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PlatformAttributesEditor } from '@/components/PlatformAttributesEditor';
import { useClientPlatformChecklistQuery, useSeedChecklist, useToggleChecklistItem } from '@/hooks/useClientPlatformChecklistQuery';
import { usePlatformCatalogQuery } from '@/hooks/usePlatformCatalogQuery';
import { PLATFORM_STATUS_OPTIONS, MOTIVO_ATRASO_OPTIONS, computeDiasEmAtraso } from '@/lib/platformUtils';
import { useActiveDelayReasons } from '@/hooks/useDelayReasonsQuery';

interface PlatformDetailModalProps {
  open: boolean;
  onClose: () => void;
  clientPlatform: ClientPlatform;
  client: Client;
  platformName: string;
  onViewDemands: () => void;
}

interface AIAnalysis {
  satisfactionScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  operationalSummary: string;
  weeklyNextSteps: string[];
  avgResponseTime: string;
}

function ScoreGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const color = score >= 8 ? 'text-success' : score >= 6 ? 'text-warning' : 'text-destructive';
  const strokeColor = score >= 8 ? 'stroke-success' : score >= 6 ? 'stroke-warning' : 'stroke-destructive';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" className="stroke-border" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" className={strokeColor} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 213.6} 213.6`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', color)}>{score.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">de 10</span>
    </div>
  );
}

export function PlatformDetailModal({ open, onClose, clientPlatform, client, platformName, onViewDemands }: PlatformDetailModalProps) {
  const { currentUser } = useAuth();
  const cp = clientPlatform;

  const { data: chatNotes = [] } = usePlatformChatNotesQuery(cp.id);
  const addNoteMut = useAddPlatformChatNote();
  const { data: changeLogs = [] } = usePlatformChangeLogsQuery(cp.id);
  const { data: documents = [] } = usePlatformDocumentsQuery(cp.id);
  const uploadDocMut = useUploadPlatformDocument();
  const deleteDocMut = useDeletePlatformDocument();
  const updatePlatform = useUpdateClientPlatform();
  const { data: phaseStatuses = [] } = usePlatformPhaseStatusesQuery();
  const { data: appUsers = [] } = useAppUsersQuery();
  const activeDelayReasons = useActiveDelayReasons();
  const { squads } = useSquads();
  const { tasks } = useTasks();

  // Checklist
  const { data: checklistItems = [] } = useClientPlatformChecklistQuery(cp.id);
  const seedChecklist = useSeedChecklist();
  const toggleItem = useToggleChecklistItem();
  const { data: catalogPlatforms = [] } = usePlatformCatalogQuery();

  const catalogEntry = catalogPlatforms.find(p => p.slug === cp.platformSlug);

  const checklistProgress = useMemo(() => {
    if (checklistItems.length === 0) return 0;
    return Math.round((checklistItems.filter(i => i.done).length / checklistItems.length) * 100);
  }, [checklistItems]);

  const blockingIncomplete = useMemo(() =>
    checklistItems.filter(i => i.bloqueiaPassagem && !i.done),
    [checklistItems]
  );

  const canMarkReady = checklistItems.length > 0 && blockingIncomplete.length === 0;

  const diasEmAtraso = computeDiasEmAtraso(cp.deadline);

  const [noteMessage, setNoteMessage] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendNote = () => {
    if (!noteMessage.trim()) return;
    addNoteMut.mutate({ clientPlatformId: cp.id, message: noteMessage.trim(), author: currentUser?.name ?? 'Usuário' });
    setNoteMessage('');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocMut.mutate({ clientPlatformId: cp.id, file, uploadedBy: currentUser?.name ?? 'Usuário' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('platform-ai-analysis', { body: { clientPlatformId: cp.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiAnalysis(data as AIAnalysis);
    } catch (err: any) {
      setAiError(err.message ?? 'Erro ao gerar análise');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSeedChecklist = () => {
    if (!catalogEntry) return;
    const items = (catalogEntry.checklist_obrigatorio as any[]).map((item: any) => ({
      id: item.id,
      label: item.label,
      etapa: item.etapa ?? '',
      bloqueia_passagem: item.bloqueia_passagem ?? false,
    }));
    seedChecklist.mutate({ clientPlatformId: cp.id, items });
  };

  const handleMarkReady = () => {
    updatePlatform.mutate({
      id: cp.id,
      updates: {
        prontaPerformance: true,
        platformStatus: 'pronta_performance',
        dataRealPassagem: new Date().toISOString().slice(0, 10),
        quemAprovouPassagem: currentUser?.name ?? 'Sistema',
      },
    });
  };

  const statusOption = PLATFORM_STATUS_OPTIONS.find(o => o.value === cp.platformStatus);

  const sentimentConfig = {
    positive: { label: 'Positivo', className: 'bg-success/15 text-success' },
    neutral: { label: 'Neutro', className: 'bg-warning/15 text-warning' },
    negative: { label: 'Atenção', className: 'bg-destructive/15 text-destructive' },
  };

  const platTasks = tasks.filter(t => t.platforms?.includes(cp.platformSlug) && t.clientId === client.id);
  const pendingCount = platTasks.filter(t => t.status !== 'done').length;
  const platSquad = squads.find(s => s.id === cp.squadId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-visible p-0">
        <div className="overflow-y-auto max-h-[85vh]">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">{client.name} — {platformName}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', statusOption?.color ?? 'bg-muted text-muted-foreground')}>
                      {statusOption?.label ?? cp.platformStatus}
                    </span>
                    {cp.dependeCliente && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">⏳ Depende Cliente</span>
                    )}
                    {cp.prontaPerformance && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✅ Pronta</span>
                    )}
                    {diasEmAtraso > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">{diasEmAtraso}d atraso</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {cp.qualityLevel && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">
                    {cp.qualityLevel === 'seller' ? '🛒 Seller' : '🏪 Lojista'}
                  </span>
                )}
                {cp.healthColor && (() => {
                  const hMap: Record<string, string> = { green: 'bg-success', yellow: 'bg-warning', orange: 'bg-warning', red: 'bg-destructive' };
                  return <span className={cn('w-3 h-3 rounded-full', hMap[cp.healthColor] ?? 'bg-border')} title={cp.healthColor} />;
                })()}
              </div>
            </div>
            <div className="mt-3">
              <Button onClick={onViewDemands} variant="outline" size="sm">
                <ListChecks className="w-4 h-4 mr-1.5" />Ver Demandas
              </Button>
            </div>
          </div>

          {/* Operational Fields */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campos Operacionais</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Status da Plataforma</label>
                <select
                  value={cp.platformStatus}
                  onChange={e => updatePlatform.mutate({ id: cp.id, updates: { platformStatus: e.target.value } })}
                  className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                >
                  {PLATFORM_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Motivo Atraso</label>
                <select
                  value={cp.motivoAtraso}
                  onChange={e => updatePlatform.mutate({ id: cp.id, updates: { motivoAtraso: e.target.value } })}
                  className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                >
                  <option value="">—</option>
                   {(activeDelayReasons.length > 0 ? activeDelayReasons.map(r => r.label) : MOTIVO_ATRASO_OPTIONS as unknown as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Prazo Interno</label>
                <Input type="date" value={cp.prazoInterno ?? ''} onChange={e => updatePlatform.mutate({ id: cp.id, updates: { prazoInterno: e.target.value || null } })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Saúde da Plataforma</label>
                <select
                  value={cp.healthColor ?? ''}
                  onChange={e => updatePlatform.mutate({ id: cp.id, updates: { healthColor: e.target.value || null } })}
                  className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                >
                  <option value="">—</option>
                  <option value="green">🟢 Excelente</option>
                  <option value="orange">🟠 Mediano</option>
                  <option value="red">🔴 Ruim</option>
                </select>
              </div>
              <div className="flex items-center gap-3 col-span-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cp.dependeCliente}
                    onCheckedChange={v => updatePlatform.mutate({ id: cp.id, updates: { dependeCliente: v } })}
                  />
                  <label className="text-xs text-foreground">Depende do Cliente</label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
              <span>{platTasks.length} demandas</span>
              <span>•</span>
              <span>{pendingCount} pendentes</span>
              {platSquad && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">Squad: {platSquad.name}</span>
                </>
              )}
            </div>
            <PlatformAttributesEditor
              platformSlug={cp.platformSlug}
              attributes={cp.platformAttributes ?? {}}
              onChange={(key, value) => {
                const newAttrs = { ...cp.platformAttributes, [key]: value };
                updatePlatform.mutate({ id: cp.id, updates: { platformAttributes: newAttrs } });
              }}
            />
          </div>

          {/* Checklist */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist da Plataforma</h4>
                {checklistItems.length > 0 && (
                  <span className="text-[10px] font-bold text-primary">{checklistProgress}%</span>
                )}
              </div>
            </div>

            {checklistItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Nenhum checklist inicializado.</p>
                {catalogEntry && (
                  <Button size="sm" variant="outline" onClick={handleSeedChecklist} disabled={seedChecklist.isPending}>
                    Inicializar Checklist ({(catalogEntry.checklist_obrigatorio as any[]).length} itens)
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Progress value={checklistProgress} className="h-2 mb-3" />
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {checklistItems.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md text-sm',
                        item.bloqueiaPassagem && !item.done ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/30'
                      )}
                    >
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={(checked) =>
                          toggleItem.mutate({
                            id: item.id,
                            done: !!checked,
                            checkedBy: currentUser?.name ?? 'Usuário',
                            clientPlatformId: cp.id,
                          })
                        }
                      />
                      <span className={cn('flex-1 text-foreground', item.done && 'line-through text-muted-foreground')}>{item.label}</span>
                      {item.etapa && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.etapa}</span>
                      )}
                      {item.bloqueiaPassagem && (
                        <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                      )}
                      {item.done && item.checkedBy && (
                        <span className="text-[10px] text-muted-foreground">{item.checkedBy}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Passagem para Performance */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passagem para Performance</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Data Prevista</label>
                <Input type="date" value={cp.dataPrevistaPassagem ?? ''} onChange={e => updatePlatform.mutate({ id: cp.id, updates: { dataPrevistaPassagem: e.target.value || null } })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Data Real</label>
                <Input type="date" value={cp.dataRealPassagem ?? ''} onChange={e => updatePlatform.mutate({ id: cp.id, updates: { dataRealPassagem: e.target.value || null } })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Quem Aprovou</label>
                <Input value={cp.quemAprovouPassagem} onChange={e => updatePlatform.mutate({ id: cp.id, updates: { quemAprovouPassagem: e.target.value } })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Pendências</label>
                <Input value={cp.pendenciasRemanescentes} onChange={e => updatePlatform.mutate({ id: cp.id, updates: { pendenciasRemanescentes: e.target.value } })} className="h-8 text-xs" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase">Observação</label>
                <Input value={cp.observacaoPassagem} onChange={e => updatePlatform.mutate({ id: cp.id, updates: { observacaoPassagem: e.target.value } })} className="h-8 text-xs" />
              </div>
            </div>

            {blockingIncomplete.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2 mb-2">
                <p className="text-xs text-destructive font-medium">⚠ {blockingIncomplete.length} item(ns) obrigatório(s) pendente(s):</p>
                <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
                  {blockingIncomplete.slice(0, 3).map(i => <li key={i.id}>{i.label}</li>)}
                  {blockingIncomplete.length > 3 && <li>e mais {blockingIncomplete.length - 3}...</li>}
                </ul>
              </div>
            )}

            {!cp.prontaPerformance && (
              <Button
                size="sm"
                disabled={!canMarkReady}
                onClick={handleMarkReady}
                className="w-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Marcar como Pronta para Performance
              </Button>
            )}
            {cp.prontaPerformance && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-emerald-700">✅ Plataforma pronta para performance</p>
                {cp.quemAprovouPassagem && <p className="text-xs text-emerald-600 mt-1">Aprovado por: {cp.quemAprovouPassagem}</p>}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Análise por IA</h4>
                {aiAnalysis && (
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', sentimentConfig[aiAnalysis.sentiment].className)}>
                    {sentimentConfig[aiAnalysis.sentiment].label}
                  </span>
                )}
              </div>
              <Button onClick={handleGenerateAI} disabled={aiLoading} variant="outline" size="sm">
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
                {aiAnalysis ? 'Atualizar' : 'Gerar Análise'}
              </Button>
            </div>
            {aiError && <p className="text-sm text-destructive mb-2">{aiError}</p>}
            {aiAnalysis && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Satisfação</span>
                    </div>
                    <ScoreGauge score={aiAnalysis.satisfactionScore} />
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageCircle className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tempo Resposta</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-lg font-bold text-foreground">{aiAnalysis.avgResponseTime}</span>
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ListChecks className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sentimento</span>
                    </div>
                    <span className={cn('text-sm font-bold mt-2', sentimentConfig[aiAnalysis.sentiment].className.replace('bg-', 'text-').split(' ')[0])}>
                      {sentimentConfig[aiAnalysis.sentiment].label}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Resumo Operacional</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.operationalSummary}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ListChecks className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Próximos Passos</span>
                  </div>
                  <ul className="space-y-2">
                    {aiAnalysis.weeklyNextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {!aiAnalysis && !aiLoading && !aiError && (
              <p className="text-sm text-muted-foreground text-center py-4">Clique em "Gerar Análise" para obter insights por IA.</p>
            )}
            {aiLoading && (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Gerando análise...</span>
              </div>
            )}
          </div>

          {/* Chat Notes */}
          <div className="px-6 py-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Observações</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
              {chatNotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Nenhuma observação ainda.</p>}
              {chatNotes.map(note => (
                <div key={note.id} className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <p className="text-sm text-foreground">{note.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{note.author}</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input value={noteMessage} onChange={e => setNoteMessage(e.target.value)} placeholder="Escreva uma observação..." className="flex-1" onKeyDown={e => { if (e.key === 'Enter') handleSendNote(); }} />
              <button onClick={handleSendNote} disabled={!noteMessage.trim() || addNoteMut.isPending}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="px-6 py-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documentos</h4>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            <div className="space-y-2 mb-3">
              {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Nenhum documento anexado.</p>}
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.uploadedBy} • {new Date(doc.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <a href={getPlatformDocumentUrl(doc.filePath)} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Visualizar">
                    <Eye className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteDocMut.mutate({ id: doc.id, filePath: doc.filePath, clientPlatformId: cp.id })}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Upload className="w-4 h-4" />Anexar documento
            </button>
          </div>

          {/* Change Logs */}
          <div className="px-6 py-4">
            <button onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <History className="w-3.5 h-3.5" />Log de Alterações ({changeLogs.length})
            </button>
            {showLogs && changeLogs.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {changeLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 text-xs bg-muted/40 rounded-md p-2">
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{log.changedBy || 'Sistema'}</span>
                      <span className="text-muted-foreground"> alterou </span>
                      <span className="font-medium text-foreground">{log.field}</span>
                      <span className="text-muted-foreground"> de </span>
                      <span className="text-destructive line-through">{log.oldValue || '(vazio)'}</span>
                      <span className="text-muted-foreground"> para </span>
                      <span className="text-success">{log.newValue}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.changedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {showLogs && changeLogs.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Nenhuma alteração registrada.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
