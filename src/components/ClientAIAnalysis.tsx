import { useState } from 'react';
import { Brain, MessageCircle, Star, AlertTriangle, ThumbsUp, Send, CheckCircle } from 'lucide-react';
import { Client, Task } from '@/types';
import { cn } from '@/lib/utils';
import { useNpsResponsesQuery, useAddNpsResponse, useUpdateNpsResponse, getNpsCategory } from '@/hooks/useNpsResponsesQuery';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ClientAIAnalysisProps {
  client: Client;
  clientTasks: Task[];
}

const categoryConfig = {
  promotor: { label: 'Promotor', emoji: '🟢', className: 'bg-success/15 text-success' },
  neutro: { label: 'Neutro', emoji: '🟡', className: 'bg-warning/15 text-warning' },
  detrator: { label: 'Detrator', emoji: '🔴', className: 'bg-destructive/15 text-destructive' },
};

export function ClientAIAnalysis({ client, clientTasks }: ClientAIAnalysisProps) {
  const { currentUser } = useAuth();
  const { data: npsResponses = [], isLoading } = useNpsResponsesQuery(client.id);
  const addNps = useAddNpsResponse();
  const updateNps = useUpdateNpsResponse();

  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState<number | ''>('');
  const [likedMost, setLikedMost] = useState('');
  const [improve, setImprove] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [actionPlanText, setActionPlanText] = useState('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  const handleSubmitNps = () => {
    if (score === '' || score < 0 || score > 10) {
      toast.error('Nota deve ser de 0 a 10');
      return;
    }
    addNps.mutate(
      {
        clientId: client.id,
        score: Number(score),
        likedMost,
        improve,
        wouldRecommend: wouldRecommend ?? undefined,
        createdBy: currentUser?.name || '',
      },
      {
        onSuccess: () => {
          toast.success('NPS registrado!');
          setShowForm(false);
          setScore('');
          setLikedMost('');
          setImprove('');
          setWouldRecommend(null);
        },
      }
    );
  };

  const handleManagerAck = (npsId: string) => {
    updateNps.mutate({ id: npsId, managerNotified: true }, {
      onSuccess: () => toast.success('Manager acionado registrado'),
    });
  };

  const handleSaveActionPlan = (npsId: string) => {
    updateNps.mutate({ id: npsId, actionPlan: actionPlanText }, {
      onSuccess: () => { toast.success('Plano de ação salvo'); setEditingActionId(null); setActionPlanText(''); },
    });
  };

  const pendingTasks = clientTasks.filter(t => t.status !== 'done').length;
  const latestNps = npsResponses[0];

  return (
    <div className="px-6 py-4 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            NPS & Satisfação
          </h4>
          {latestNps?.category && (
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', categoryConfig[latestNps.category as keyof typeof categoryConfig]?.className || 'bg-muted text-muted-foreground')}>
              {categoryConfig[latestNps.category as keyof typeof categoryConfig]?.emoji} {categoryConfig[latestNps.category as keyof typeof categoryConfig]?.label || latestNps.category}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="text-xs h-7 gap-1">
          <Send className="w-3 h-3" />
          {showForm ? 'Cancelar' : 'Registrar NPS'}
        </Button>
      </div>

      {/* NPS Form */}
      {showForm && (
        <div className="bg-muted/40 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nota (0-10)</Label>
              <Input
                type="number" min={0} max={10}
                value={score} onChange={e => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-8 text-sm"
                placeholder="0-10"
              />
              {score !== '' && (
                <span className={cn('text-[10px] font-semibold', categoryConfig[getNpsCategory(Number(score)) as keyof typeof categoryConfig]?.className)}>
                  {categoryConfig[getNpsCategory(Number(score)) as keyof typeof categoryConfig]?.emoji} {categoryConfig[getNpsCategory(Number(score)) as keyof typeof categoryConfig]?.label}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Indicaria o Grupo TG?</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant={wouldRecommend === true ? 'default' : 'outline'} onClick={() => setWouldRecommend(true)} className="text-xs h-7">Sim</Button>
                <Button size="sm" variant={wouldRecommend === false ? 'default' : 'outline'} onClick={() => setWouldRecommend(false)} className="text-xs h-7">Não</Button>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">O que mais gostou?</Label>
            <Textarea value={likedMost} onChange={e => setLikedMost(e.target.value)} className="text-sm min-h-[50px]" placeholder="Feedback positivo..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">O que melhorar?</Label>
            <Textarea value={improve} onChange={e => setImprove(e.target.value)} className="text-sm min-h-[50px]" placeholder="Sugestões de melhoria..." />
          </div>
          <Button onClick={handleSubmitNps} disabled={addNps.isPending} className="w-full text-sm h-8">
            {addNps.isPending ? 'Salvando...' : 'Salvar NPS'}
          </Button>
        </div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Último NPS</span>
          </div>
          {latestNps?.score != null ? (
            <>
              <span className={cn('text-2xl font-bold', latestNps.score >= 9 ? 'text-success' : latestNps.score >= 7 ? 'text-warning' : 'text-destructive')}>
                {latestNps.score}
              </span>
              <span className="text-[10px] text-muted-foreground">de 10</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageCircle className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Respostas NPS</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{npsResponses.length}</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
        <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Demandas</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{pendingTasks}</span>
          <span className="text-[10px] text-muted-foreground">pendentes</span>
        </div>
      </div>

      {/* Alerts */}
      {latestNps && latestNps.score != null && latestNps.score <= 6 && !latestNps.managerNotified && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive">⚠ NPS Detrator — Manager precisa acionar em 24h</p>
            <p className="text-xs text-muted-foreground mt-1">Nota {latestNps.score}/10 registrada em {format(new Date(latestNps.createdAt), 'dd/MM HH:mm')}</p>
            <Button size="sm" variant="destructive" className="mt-2 h-6 text-xs" onClick={() => handleManagerAck(latestNps.id)}>
              Marcar como acionado
            </Button>
          </div>
        </div>
      )}

      {latestNps && latestNps.score != null && latestNps.score >= 9 && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4 flex items-start gap-2">
          <ThumbsUp className="w-4 h-4 text-success mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-success">🎉 Promotor! Sugestão: pedir indicação</p>
            <p className="text-xs text-muted-foreground mt-1">Cliente satisfeito — ótima oportunidade de referral.</p>
          </div>
        </div>
      )}

      {/* NPS History */}
      {npsResponses.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <h5 className="text-xs font-semibold text-foreground mb-3">Histórico NPS</h5>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {npsResponses.map(nps => {
              const cat = categoryConfig[nps.category as keyof typeof categoryConfig];
              return (
                <div key={nps.id} className="p-2.5 bg-background rounded-md border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', cat?.className || 'bg-muted text-muted-foreground')}>
                        {cat?.emoji} {nps.score}/10
                      </span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(nps.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">por {nps.createdBy || 'Sistema'}</span>
                  </div>
                  {nps.likedMost && (
                    <p className="text-xs text-muted-foreground mt-1"><strong className="text-foreground">Gostou:</strong> {nps.likedMost}</p>
                  )}
                  {nps.improve && (
                    <p className="text-xs text-muted-foreground mt-0.5"><strong className="text-foreground">Melhorar:</strong> {nps.improve}</p>
                  )}
                  {nps.wouldRecommend != null && (
                    <p className="text-xs text-muted-foreground mt-0.5"><strong className="text-foreground">Indicaria:</strong> {nps.wouldRecommend ? 'Sim ✅' : 'Não ❌'}</p>
                  )}
                  {nps.managerNotified && (
                    <span className="text-[10px] text-success font-medium mt-1 inline-block">✓ Manager acionado</span>
                  )}
                  {/* Action plan */}
                  {nps.score != null && nps.score <= 6 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      {editingActionId === nps.id ? (
                        <div className="space-y-1.5">
                          <Textarea value={actionPlanText} onChange={e => setActionPlanText(e.target.value)} className="text-xs min-h-[40px]" placeholder="Plano de ação..." />
                          <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-xs" onClick={() => handleSaveActionPlan(nps.id)}>Salvar</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingActionId(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {nps.actionPlan ? (
                            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Plano de ação:</strong> {nps.actionPlan}</p>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-primary" onClick={() => { setEditingActionId(nps.id); setActionPlanText(nps.actionPlan || ''); }}>
                              + Adicionar plano de ação
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && npsResponses.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum NPS registrado. Clique em "Registrar NPS" para iniciar.
        </p>
      )}
    </div>
  );
}
