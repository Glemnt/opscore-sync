import { useState, useRef } from 'react';
import { Brain, Send, History, Upload, Eye, Trash2, FileText, User, MessageCircle, Clock, ListChecks, Star, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePlatformChatNotesQuery, useAddPlatformChatNote, useDeletePlatformChatNote } from '@/hooks/usePlatformChatNotesQuery';
import { usePlatformChangeLogsQuery } from '@/hooks/usePlatformChangeLogsQuery';
import { usePlatformDocumentsQuery, useUploadPlatformDocument, useDeletePlatformDocument, getPlatformDocumentUrl } from '@/hooks/usePlatformDocumentsQuery';
import type { ClientPlatform } from '@/hooks/useClientPlatformsQuery';
import type { Task } from '@/types';

// ─── AI Analysis (mock) ───
function PlatformAIAnalysis({ cp, tasks }: { cp: ClientPlatform; tasks: Task[] }) {
  const pendingCount = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="border-t border-border pt-3 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Brain className="w-3 h-3 text-primary" />
        </div>
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Análise por IA</h4>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <ListChecks className="w-3 h-3 text-primary mx-auto mb-1" />
          <span className="text-lg font-bold text-foreground">{tasks.length}</span>
          <p className="text-[9px] text-muted-foreground">demandas</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <Clock className="w-3 h-3 text-warning mx-auto mb-1" />
          <span className="text-lg font-bold text-foreground">{pendingCount}</span>
          <p className="text-[9px] text-muted-foreground">pendentes</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <Star className="w-3 h-3 text-primary mx-auto mb-1" />
          <span className="text-lg font-bold text-foreground">
            {cp.healthColor === 'green' ? '🟢' : cp.healthColor === 'orange' ? '🟠' : cp.healthColor === 'red' ? '🔴' : '—'}
          </span>
          <p className="text-[9px] text-muted-foreground">saúde</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Análise automática disponível em breve. Os dados acima refletem o estado atual da plataforma.
      </p>
    </div>
  );
}

// ─── Observações ───
function PlatformNotes({ platformId }: { platformId: string }) {
  const { data: notes = [] } = usePlatformChatNotesQuery(platformId);
  const addNote = useAddPlatformChatNote();
  const [msg, setMsg] = useState('');

  const handleSend = () => {
    if (!msg.trim()) return;
    addNote.mutate({ clientPlatformId: platformId, message: msg.trim(), author: 'Usuário' });
    setMsg('');
  };

  return (
    <div className="border-t border-border pt-3 mt-3">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Observações</h4>
      <div className="space-y-2 max-h-36 overflow-y-auto mb-2">
        {notes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma observação.</p>}
        {notes.map(note => (
          <div key={note.id} className="bg-primary/5 border border-primary/10 rounded-lg p-2">
            <p className="text-xs text-foreground">{note.message}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <User className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">{note.author}</span>
              <span className="text-[9px] text-muted-foreground">•</span>
              <span className="text-[9px] text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Escreva uma observação..."
          className="flex-1 h-8 text-xs"
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button onClick={handleSend} disabled={!msg.trim()} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Documentos ───
function PlatformDocuments({ platformId }: { platformId: string }) {
  const { data: docs = [] } = usePlatformDocumentsQuery(platformId);
  const uploadDoc = useUploadPlatformDocument();
  const deleteDoc = useDeletePlatformDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDoc.mutate({ clientPlatformId: platformId, file, uploadedBy: 'Usuário' });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="border-t border-border pt-3 mt-3">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documentos</h4>
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      <div className="space-y-1.5 mb-2">
        {docs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum documento.</p>}
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{doc.fileName}</span>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
              {new Date(doc.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
            <a href={getPlatformDocumentUrl(doc.filePath)} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </a>
            <button onClick={() => deleteDoc.mutate({ id: doc.id, filePath: doc.filePath, clientPlatformId: platformId })} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploadDoc.isPending}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        {uploadDoc.isPending ? 'Enviando...' : 'Anexar documento'}
      </button>
    </div>
  );
}

// ─── Log de Alterações ───
function PlatformChangeLogs({ platformId }: { platformId: string }) {
  const { data: logs = [] } = usePlatformChangeLogsQuery(platformId);
  const [show, setShow] = useState(false);

  return (
    <div className="border-t border-border pt-3 mt-3">
      <button onClick={() => setShow(!show)} className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
        <History className="w-3 h-3" />
        Log de Alterações ({logs.length})
      </button>
      {show && logs.length > 0 && (
        <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-1.5 text-[10px] bg-muted/40 rounded-md p-1.5">
              <div className="flex-1">
                <span className="font-medium text-foreground">{log.changedBy || 'Sistema'}</span>
                <span className="text-muted-foreground"> alterou </span>
                <span className="font-medium text-foreground">{log.field}</span>
                <span className="text-muted-foreground"> de </span>
                <span className="text-destructive line-through">{log.oldValue || '(vazio)'}</span>
                <span className="text-muted-foreground"> para </span>
                <span className="text-success">{log.newValue}</span>
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                {new Date(log.changedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
      {show && logs.length === 0 && (
        <p className="text-[10px] text-muted-foreground mt-1.5">Nenhuma alteração registrada.</p>
      )}
    </div>
  );
}

// ─── Combined export ───
export function PlatformDetailSections({ cp, tasks }: { cp: ClientPlatform; tasks: Task[] }) {
  return (
    <>
      <PlatformAIAnalysis cp={cp} tasks={tasks} />
      <PlatformNotes platformId={cp.id} />
      <PlatformDocuments platformId={cp.id} />
      <PlatformChangeLogs platformId={cp.id} />
    </>
  );
}
