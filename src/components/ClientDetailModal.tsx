import { useState, useMemo, useRef } from 'react';
import { Building2, Calendar, Clock, User, CheckCircle2, AlertCircle, ClipboardList, Circle, Send, History, Edit3, Save, X, FileText, Upload, Eye, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/shared';
import { clientStatusConfig, taskStatusConfig, taskTypeConfig } from '@/lib/config';
import { Client, Task } from '@/types';
import { cn } from '@/lib/utils';
import { squads, projects, tasks } from '@/data/mockData';
import { useClients } from '@/contexts/ClientsContext';
import { ClientAIAnalysis } from '@/components/ClientAIAnalysis';

interface ClientDetailModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}

export function ClientDetailModal({ client, open, onClose }: ClientDetailModalProps) {
  const { updateClientField, addChatNote } = useClients();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [noteMessage, setNoteMessage] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  const nextPaymentDate = useMemo(() => {
    if (!client) return '';
    const now = new Date();
    const start = new Date(client.startDate + 'T00:00:00');

    if (client.contractType === 'mrr') {
      const candidate = new Date(now.getFullYear(), now.getMonth(), client.paymentDay);
      if (candidate <= now) {
        candidate.setMonth(candidate.getMonth() + 1);
      }
      return candidate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } else {
      const interval = client.contractDurationMonths ?? 3;
      let next = new Date(start);
      next.setMonth(next.getMonth() + interval);
      while (next <= now) {
        next.setMonth(next.getMonth() + interval);
      }
      return next.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }, [client?.startDate, client?.contractType, client?.paymentDay, client?.contractDurationMonths]);

  if (!client) return null;

  const statusConf = clientStatusConfig[client.status];
  const squad = squads.find((s) => s.id === client.squadId);
  const clientProject = projects.find((p) => p.clientId === client.id);
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const doneTasks = clientTasks.filter((t) => t.status === 'done');
  const pendingTasks = clientTasks.filter((t) => t.status !== 'done');
  const sortedTasks = [...clientTasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string, fieldLabel: string) => {
    if (editValue !== String((client as any)[field] ?? '')) {
      updateClientField(client.id, field, field === 'monthlyRevenue' ? Number(editValue) : editValue, fieldLabel);
    }
    setEditingField(null);
  };

  const cancelEdit = () => { setEditingField(null); setEditValue(''); };

  const handleSendNote = () => {
    if (!noteMessage.trim()) return;
    addChatNote(client.id, noteMessage.trim());
    setNoteMessage('');
  };

  const EditableField = ({ field, label, value, type = 'text' }: { field: string; label: string; value: string; type?: string }) => {
    const isEditing = editingField === field;
    return (
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            {field === 'squadId' ? (
              <select
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="flex-1 text-sm bg-background border border-input rounded px-2 py-1 text-foreground"
              >
                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <Input type={type} value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-sm flex-1" />
            )}
            <button onClick={() => saveEdit(field, label)} className="p-1 text-success hover:bg-success/10 rounded"><Save className="w-3.5 h-3.5" /></button>
            <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between group/edit">
            <p className="text-sm font-semibold text-foreground">{value}</p>
            <button onClick={() => startEdit(field, field === 'squadId' ? client.squadId : String((client as any)[field] ?? ''))} className="opacity-0 group-hover/edit:opacity-100 p-1 text-muted-foreground hover:text-primary rounded transition-opacity">
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">{client.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{client.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {client.contractType === 'mrr' ? 'MRR' : `TCV ${client.contractDurationMonths}m`}
              </span>
            </div>
          </div>

          {/* Editable info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <EditableField field="startDate" label="Entrada" value={formatDate(client.startDate)} type="date" />
            <EditableField field="monthlyRevenue" label="Mensalidade" value={client.monthlyRevenue ? `R$ ${client.monthlyRevenue.toLocaleString('pt-BR')}` : '—'} type="number" />
            <EditableField field="squadId" label="Squad" value={squad?.name ?? '—'} />
            <EditableField field="responsible" label="Responsável" value={client.responsible || '—'} />
          </div>

          {/* Health color selector */}
          <div className="mt-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Saúde do Cliente</p>
            <div className="flex items-center gap-2">
              {([
                { value: 'green' as const, color: 'bg-success', label: 'Saudável' },
                { value: 'yellow' as const, color: 'bg-warning', label: 'Atenção' },
                { value: 'red' as const, color: 'bg-destructive', label: 'Crítico' },
                { value: 'white' as const, color: 'bg-border', label: 'Não avaliado' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateClientField(client.id, 'healthColor', opt.value, 'Saúde do Cliente')}
                  title={opt.label}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    opt.color,
                    client.healthColor === opt.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border hover:scale-105'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Contract file */}
          <ContractSection client={client} updateClientField={updateClientField} />
        </div>

        {/* Stats bar */}
        <div className="px-6 py-3 flex items-center gap-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Concluídas:</span>
            <span className="font-bold text-foreground">{doneTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span className="text-muted-foreground">Pendentes:</span>
            <span className="font-bold text-foreground">{pendingTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-foreground">{clientTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Próx. pagamento</span>
            <span className="font-bold text-foreground">{nextPaymentDate}</span>
          </div>
        </div>

        {/* Project summary */}
        {clientProject && (
          <div className="px-6 py-4 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">DEMANDAS</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{clientProject.name}</span>
                <span className="text-xs text-muted-foreground">{clientProject.progress}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${clientProject.progress}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Início: {formatDate(clientProject.startDate)}</span>
                <span>Prazo: {formatDate(clientProject.deadline)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="px-6 py-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Linha do tempo de demandas
          </h4>
          {sortedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma demanda registrada.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-4">
                {sortedTasks.map((task, index) => (
                  <TimelineItem key={task.id} task={task} isLast={index === sortedTasks.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        <ClientAIAnalysis client={client} clientTasks={clientTasks} />

        {/* Chat-style Notes */}
        <div className="px-6 py-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Observações</h4>

          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {client.notes && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{client.notes}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Nota inicial</p>
              </div>
            )}
            {client.chatNotes.map(note => (
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
            <Input
              value={noteMessage}
              onChange={e => setNoteMessage(e.target.value)}
              placeholder="Escreva uma observação..."
              className="flex-1"
              onKeyDown={e => { if (e.key === 'Enter') handleSendNote(); }}
            />
            <button onClick={handleSendNote} disabled={!noteMessage.trim()} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Change Log */}
        <div className="px-6 py-4 border-t border-border">
          <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            <History className="w-3.5 h-3.5" />
            Log de Alterações ({client.changeLogs.length})
          </button>

          {showLogs && client.changeLogs.length > 0 && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {[...client.changeLogs].reverse().map(log => (
                <div key={log.id} className="flex items-start gap-2 text-xs bg-muted/40 rounded-md p-2">
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{log.changedBy}</span>
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

          {showLogs && client.changeLogs.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">Nenhuma alteração registrada.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineItem({ task, isLast }: { task: Task; isLast: boolean }) {
  const statusConf = taskStatusConfig[task.status];
  const typeConf = taskTypeConfig[task.type];
  const isDone = task.status === 'done';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="relative flex items-start gap-3 pl-0">
      <div className={cn('relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5', isDone ? 'bg-success text-success-foreground' : 'bg-card border-2 border-border')}>
        {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-2.5 h-2.5 text-muted-foreground" />}
      </div>
      <div className={cn('flex-1 bg-card rounded-lg border border-border p-3 transition-colors', isDone && 'opacity-75')}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn('text-sm font-medium', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>{task.title}</p>
          <StatusBadge className={statusConf.className}>{statusConf.label}</StatusBadge>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', typeConf.color)}>{typeConf.label}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Criada: {formatDate(task.createdAt)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Prazo: {formatDate(task.deadline)}</span>
          {task.realTime && <span>{task.realTime}h realizadas</span>}
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.responsible}</span>
        </div>
        {task.comments && <p className="text-xs text-muted-foreground mt-1.5 italic">{task.comments}</p>}
      </div>
    </div>
  );
}

function ContractSection({ client, updateClientField }: { client: Client; updateClientField: (id: string, field: string, value: any, label: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateClientField(client.id, 'contractFile', {
      name: file.name,
      url,
      uploadedAt: new Date().toISOString(),
    }, 'Contrato');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    updateClientField(client.id, 'contractFile', undefined, 'Contrato');
  };

  return (
    <div className="mt-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Contrato</p>
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />

      {client.contractFile ? (
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{client.contractFile.name}</p>
            <p className="text-[10px] text-muted-foreground">
              Enviado em {new Date(client.contractFile.uploadedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <a
            href={client.contractFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 w-full bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4" />
          Anexar contrato
        </button>
      )}
    </div>
  );
}
