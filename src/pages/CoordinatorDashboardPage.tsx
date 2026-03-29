import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasksQuery, useUpdateTask } from '@/hooks/useTasksQuery';
import { useAppUsersQuery } from '@/hooks/useAppUsersQuery';
import { useSquadsQuery } from '@/hooks/useSquadsQuery';
import { useClientPlatformsQuery } from '@/hooks/useClientPlatformsQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, XCircle, ExternalLink, Image, Clock, AlertTriangle, Shield, Users, Star, Inbox } from 'lucide-react';
import { differenceInHours, differenceInDays, startOfDay, isToday, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Task } from '@/types';

export function CoordinatorDashboardPage() {
  const { currentUser } = useAuth();
  const { data: tasks = [] } = useTasksQuery();
  const { data: users = [] } = useAppUsersQuery();
  const { data: squads = [] } = useSquadsQuery();
  const { data: clientPlatforms = [] } = useClientPlatformsQuery();
  const updateTask = useUpdateTask();

  const [approvalDialog, setApprovalDialog] = useState<{ task: Task; action: 'approve' | 'reject' } | null>(null);
  const [nota, setNota] = useState<number>(7);
  const [rejectionReason, setRejectionReason] = useState('');
  const [metaDia, setMetaDia] = useState(24);
  const [csDemandFilter, setCsDemandFilter] = useState<string>('all');

  // Find squads where current user is leader
  const mySquads = useMemo(() =>
    squads.filter(s => s.leader === currentUser?.name),
    [squads, currentUser]
  );

  const mySquadIds = useMemo(() => mySquads.map(s => s.id), [mySquads]);

  // Get squad member names
  const squadMembers = useMemo(() => {
    const memberNames = new Set<string>();
    for (const u of users) {
      if (u.squadIds?.some((sid: string) => mySquadIds.includes(sid))) {
        memberNames.add(u.name);
      }
    }
    // Also include members from squads array
    for (const sq of mySquads) {
      for (const m of sq.members) memberNames.add(m);
    }
    return Array.from(memberNames);
  }, [users, mySquads, mySquadIds]);

  // Squad tasks
  const squadTasks = useMemo(() =>
    tasks.filter(t => squadMembers.includes(t.responsible)),
    [tasks, squadMembers]
  );

  // ─── Section 1: Approval Feed ───
  const pendingApproval = useMemo(() =>
    squadTasks
      .filter(t => t.status === 'aguardando_aprovacao')
      .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime()),
    [squadTasks]
  );

  const isNew = (t: Task) => {
    const ref = t.completedAt || t.createdAt;
    return differenceInHours(new Date(), new Date(ref)) <= 2;
  };

  const handleApprove = async () => {
    if (!approvalDialog || !currentUser) return;
    try {
      await updateTask.mutateAsync({
        id: approvalDialog.task.id,
        updates: {
          status: 'done' as any,
          approvalStatus: 'approved',
          approvedBy: currentUser.name,
          approvedAt: new Date().toISOString(),
          notaEntrega: nota,
          completedAt: new Date().toISOString(),
        }
      });
      toast.success('Entrega aprovada!');
      setApprovalDialog(null);
    } catch { toast.error('Erro ao aprovar'); }
  };

  const handleReject = async () => {
    if (!approvalDialog || !currentUser || !rejectionReason.trim()) {
      toast.error('Informe o motivo da reprovação');
      return;
    }
    try {
      await updateTask.mutateAsync({
        id: approvalDialog.task.id,
        updates: {
          status: 'in_progress' as any,
          approvalStatus: 'rejected',
          rejectionReason,
          rejectionCount: (approvalDialog.task.rejectionCount ?? 0) + 1,
        }
      });
      toast.success('Entrega reprovada e devolvida');
      setApprovalDialog(null);
      setRejectionReason('');
    } catch { toast.error('Erro ao reprovar'); }
  };

  // ─── Section 2 & 3: Ad Control / Summary per Collaborator ───
  const today = startOfDay(new Date());

  const collabStats = useMemo(() => {
    return squadMembers.map(name => {
      const memberTasks = squadTasks.filter(t => t.responsible === name);
      const doneTasks = memberTasks.filter(t => t.status === 'done' && t.approvalStatus === 'approved');
      const todayDone = doneTasks.filter(t => t.completedAt && isToday(parseISO(t.completedAt)));
      const anunciosDone = doneTasks.filter(t => t.type === 'anuncio');
      const totalAnuncios = anunciosDone.length;
      const todayAnuncios = todayDone.filter(t => t.type === 'anuncio').length;

      // Platforms assigned
      const memberPlatforms = clientPlatforms.filter(cp => cp.responsible === name);
      const contas = memberPlatforms.length;

      const meta = metaDia;
      const faltam = Math.max(0, meta - todayAnuncios);
      const pct = meta > 0 ? Math.round((todayAnuncios / meta) * 100) : 0;

      // Urgents = overdue tasks
      const urgentes = memberTasks.filter(t => {
        if (t.status === 'done') return false;
        return new Date(t.deadline) < today;
      }).length;

      // Average velocity (tasks done per day over last 30 days)
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDone = doneTasks.filter(t => t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo);
      const avgPerDay = recentDone.length / 30;
      const diasParaFinalizar = avgPerDay > 0 ? Math.ceil(faltam / avgPerDay) : 999;

      return {
        name,
        contas,
        meta,
        feitos: todayAnuncios,
        totalFeitos: totalAnuncios,
        faltam,
        pct,
        urgentes,
        diasParaFinalizar,
        totalEntregas: doneTasks.length,
        pendentes: memberTasks.filter(t => t.status !== 'done').length,
      };
    });
  }, [squadMembers, squadTasks, clientPlatforms, metaDia, today]);

  // ─── Section 4: Quality Metrics ───
  const qualityData = useMemo(() => {
    return squadMembers.map(name => {
      const memberDone = squadTasks.filter(t => t.responsible === name && t.status === 'done' && t.approvalStatus === 'approved');
      const withNota = memberDone.filter(t => t.notaEntrega != null);
      const avg = withNota.length > 0 ? withNota.reduce((sum, t) => sum + (t.notaEntrega ?? 0), 0) / withNota.length : 0;
      const rejections = squadTasks.filter(t => t.responsible === name && (t.rejectionCount ?? 0) > 0);
      const totalRejections = rejections.reduce((sum, t) => sum + (t.rejectionCount ?? 0), 0);
      const reworkRate = memberDone.length > 0 ? Math.round((totalRejections / (memberDone.length + totalRejections)) * 100) : 0;
      return {
        name: name.split(' ')[0],
        fullName: name,
        avg: Math.round(avg * 10) / 10,
        totalEntregas: memberDone.length,
        totalReprovacoes: totalRejections,
        reworkRate,
      };
    }).filter(d => d.totalEntregas > 0 || d.totalReprovacoes > 0);
  }, [squadMembers, squadTasks]);

  const overallAvg = useMemo(() => {
    if (qualityData.length === 0) return 0;
    return qualityData.reduce((s, d) => s + d.avg, 0) / qualityData.length;
  }, [qualityData]);

  // ─── Section 5: CS Demands ───
  const csDemands = useMemo(() =>
    squadTasks
      .filter(t => t.origemTarefa === 'manual' && t.type === 'solicitacao_cs')
      .filter(t => csDemandFilter === 'all' || t.priority === csDemandFilter)
      .sort((a, b) => {
        const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
      }),
    [squadTasks, csDemandFilter]
  );

  const statusColor = (pct: number) => {
    if (pct >= 100) return 'text-emerald-400';
    if (pct >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const statusBadge = (pct: number) => {
    if (pct >= 100) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Finalizado</Badge>;
    if (pct >= 50) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Em andamento</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Pendente</Badge>;
  };

  const demandStatusLabel = (status: string) => {
    if (status === 'done') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Resolvido</Badge>;
    if (status === 'in_progress') return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em análise</Badge>;
    return <Badge className="bg-muted text-muted-foreground">Pendente</Badge>;
  };

  if (mySquads.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Sem squad atribuído</h2>
            <p className="text-muted-foreground">Você precisa ser líder de um squad para acessar este painel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel do Coordenador</h1>
          <p className="text-sm text-muted-foreground">
            Squad{mySquads.length > 1 ? 's' : ''}: {mySquads.map(s => s.name).join(', ')} · {squadMembers.length} colaboradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Meta/dia:</span>
          <Input
            type="number"
            value={metaDia}
            onChange={e => setMetaDia(Number(e.target.value) || 24)}
            className="w-16 h-8 text-xs"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20"><Clock className="w-5 h-5 text-orange-400" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingApproval.length}</p>
                <p className="text-xs text-muted-foreground">Aguardando Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {squadTasks.filter(t => t.status === 'done' && t.approvalStatus === 'approved' && t.completedAt && isToday(parseISO(t.completedAt))).length}
                </p>
                <p className="text-xs text-muted-foreground">Aprovadas Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {squadTasks.filter(t => t.status !== 'done' && new Date(t.deadline) < today).length}
                </p>
                <p className="text-xs text-muted-foreground">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20"><Inbox className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{csDemands.filter(d => d.status !== 'done').length}</p>
                <p className="text-xs text-muted-foreground">Demandas CS Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="aprovacoes" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="aprovacoes">🔔 Aprovações ({pendingApproval.length})</TabsTrigger>
          <TabsTrigger value="anuncios">📊 Anúncios</TabsTrigger>
          <TabsTrigger value="resumo">📈 Resumo Colabs</TabsTrigger>
          <TabsTrigger value="notas">⭐ Notas</TabsTrigger>
          <TabsTrigger value="cs-demandas">📩 Demandas CS</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Approval Feed ─── */}
        <TabsContent value="aprovacoes" className="space-y-3">
          {pendingApproval.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma entrega aguardando aprovação</CardContent></Card>
          ) : (
            pendingApproval.map(task => (
              <Card key={task.id} className={`transition-all ${isNew(task) ? 'ring-2 ring-orange-500/50 animate-pulse' : ''}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isNew(task) && <Badge className="bg-orange-500 text-white text-[10px] animate-bounce">NOVO</Badge>}
                        <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>👤 {task.responsible}</span>
                        <span>🏢 {task.clientName}</span>
                        {task.platforms?.[0] && <span>📦 {task.platforms[0]}</span>}
                        {task.tempoRealMinutos != null && (
                          <span className="text-blue-400">⏱ {Math.round(task.tempoRealMinutos)}min</span>
                        )}
                        {task.rejectionCount && task.rejectionCount > 0 && (
                          <Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]">
                            {task.rejectionCount}x reprovada
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.linkEntrega && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={task.linkEntrega} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" /> Link
                          </a>
                        </Button>
                      )}
                      {task.printEntrega && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={task.printEntrega} target="_blank" rel="noopener noreferrer">
                            <Image className="w-3 h-3 mr-1" /> Print
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { setApprovalDialog({ task, action: 'approve' }); setNota(7); }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setApprovalDialog({ task, action: 'reject' }); setRejectionReason(''); }}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ─── Tab 2: Ad Control ─── */}
        <TabsContent value="anuncios">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Controle de Anúncios por Colaborador</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-center">Contas</TableHead>
                    <TableHead className="text-center">Meta/dia</TableHead>
                    <TableHead className="text-center">Feitos Hoje</TableHead>
                    <TableHead className="text-center">Faltam</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collabStats.map(s => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">{s.contas}</TableCell>
                      <TableCell className="text-center">{s.meta}</TableCell>
                      <TableCell className={`text-center font-semibold ${statusColor(s.pct)}`}>{s.feitos}</TableCell>
                      <TableCell className="text-center">{s.faltam}</TableCell>
                      <TableCell className={`text-center font-semibold ${statusColor(s.pct)}`}>{s.pct}%</TableCell>
                      <TableCell className="text-center">{statusBadge(s.pct)}</TableCell>
                    </TableRow>
                  ))}
                  {collabStats.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 3: Summary ─── */}
        <TabsContent value="resumo">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo por Colaborador</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-center">Contas</TableHead>
                    <TableHead className="text-center">Total Feitos</TableHead>
                    <TableHead className="text-center">Pendentes</TableHead>
                    <TableHead className="text-center">Urgentes</TableHead>
                    <TableHead className="text-center">Dias p/ Finalizar</TableHead>
                    <TableHead>Alerta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collabStats.map(s => (
                    <TableRow key={s.name} className={s.pct < 50 ? 'bg-red-500/5' : ''}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">{s.contas}</TableCell>
                      <TableCell className="text-center">{s.totalFeitos}</TableCell>
                      <TableCell className="text-center">{s.pendentes}</TableCell>
                      <TableCell className="text-center">
                        {s.urgentes > 0 ? <span className="text-red-400 font-semibold">{s.urgentes}</span> : '0'}
                      </TableCell>
                      <TableCell className="text-center">{s.diasParaFinalizar >= 999 ? '—' : s.diasParaFinalizar}</TableCell>
                      <TableCell>
                        {s.pct < 50 && (
                          <span className="text-xs text-red-400 font-semibold">🚨 Crítico: {s.pct}% feito</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 4: Quality ─── */}
        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nota Média por Analista</CardTitle>
            </CardHeader>
            <CardContent>
              {qualityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={qualityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="avg" name="Nota Média" radius={[4, 4, 0, 0]}>
                      {qualityData.map((entry, i) => (
                        <Cell key={i} fill={entry.avg < overallAvg ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-6">Sem dados de notas</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Analista</TableHead>
                    <TableHead className="text-center">Nota Média</TableHead>
                    <TableHead className="text-center">Entregas</TableHead>
                    <TableHead className="text-center">Reprovações</TableHead>
                    <TableHead className="text-center">Taxa Retrabalho</TableHead>
                    <TableHead>Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualityData.map(d => (
                    <TableRow key={d.fullName}>
                      <TableCell className="font-medium">{d.fullName}</TableCell>
                      <TableCell className={`text-center font-semibold ${d.avg < overallAvg ? 'text-red-400' : 'text-emerald-400'}`}>
                        {d.avg.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">{d.totalEntregas}</TableCell>
                      <TableCell className="text-center">{d.totalReprovacoes}</TableCell>
                      <TableCell className="text-center">{d.reworkRate}%</TableCell>
                      <TableCell>
                        {d.avg < overallAvg && d.totalEntregas > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Abaixo da média</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 5: CS Demands ─── */}
        <TabsContent value="cs-demandas" className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Select value={csDemandFilter} onValueChange={setCsDemandFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {csDemands.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma demanda do CS</CardContent></Card>
          ) : (
            csDemands.map(d => (
              <Card key={d.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm text-foreground truncate">{d.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>🏢 {d.clientName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {d.priority === 'high' ? 'P1 - Alta' : d.priority === 'medium' ? 'P2 - Média' : 'P3 - Baixa'}
                        </Badge>
                        {d.comments && <span className="truncate max-w-[200px]">{d.comments}</span>}
                      </div>
                    </div>
                    <div className="shrink-0">{demandStatusLabel(d.status)}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Approval / Rejection Dialog */}
      <Dialog open={!!approvalDialog} onOpenChange={() => setApprovalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog?.action === 'approve' ? '✅ Aprovar Entrega' : '❌ Reprovar Entrega'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{approvalDialog?.task.title}</strong> — {approvalDialog?.task.responsible}
            </p>
            {approvalDialog?.action === 'approve' ? (
              <div>
                <label className="text-sm font-medium text-foreground">Nota (0-10) *</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={nota}
                  onChange={e => setNota(Math.min(10, Math.max(0, Number(e.target.value))))}
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-foreground">Motivo da reprovação *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Descreva o que precisa ser corrigido..."
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(null)}>Cancelar</Button>
            {approvalDialog?.action === 'approve' ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>Confirmar Aprovação</Button>
            ) : (
              <Button variant="destructive" onClick={handleReject}>Confirmar Reprovação</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
