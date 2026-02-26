import { useState, useRef } from 'react';
import { CheckCircle2, MessageSquare, ClipboardCheck, Send, ChevronLeft, ChevronRight, Paperclip, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from '@/types';
import { Avatar } from '@/components/ui/shared';
import { projectTypeConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

interface Attachment {
  name: string;
  type: string;
  url: string;
}

interface Observation {
  id: string;
  author: string;
  text: string;
  date: Date;
  attachments?: Attachment[];
}

const initialObservations: Observation[] = [
  {
    id: '1',
    author: 'Ana Silva',
    text: 'Cliente solicitou ajuste no layout da página inicial.',
    date: new Date(2026, 1, 20, 14, 30),
  },
  {
    id: '2',
    author: 'Carlos Lima',
    text: 'Entrega parcial aprovada pelo cliente.',
    date: new Date(2026, 1, 18, 10, 15),
  },
  {
    id: '3',
    author: 'Maria Santos',
    text: 'Reunião de alinhamento realizada com sucesso.',
    date: new Date(2026, 1, 15, 16, 0),
  },
];

export function ProjectSummaryPanel({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [observations, setObservations] = useState<Observation[]>(initialObservations);
  const [newNote, setNewNote] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doneProjects = projects
    .filter((p) => p.status === 'done')
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

  const handleAddObservation = () => {
    if (!newNote.trim() && pendingFiles.length === 0) return;
    setObservations((prev) => [
      {
        id: `obs_${Date.now()}`,
        author: 'Você',
        text: newNote.trim(),
        date: new Date(),
        attachments: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
      },
      ...prev,
    ]);
    setNewNote('');
    setPendingFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPendingFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, url: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Collapsed state
  if (!isOpen) {
    return (
      <div className="w-10 flex-shrink-0 bg-card border border-border rounded-xl shadow-sm-custom flex flex-col items-center py-4 transition-all duration-300">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Expandir painel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[360px] flex-shrink-0 bg-card border border-border rounded-xl shadow-sm-custom flex flex-col overflow-hidden transition-all duration-300">
      {/* Collapse button */}
      <div className="flex justify-end p-2 pb-0">
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Minimizar painel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline de concluídos */}
      <div className="p-4 pt-1 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Demandas Concluídas</h3>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium ml-auto">
            {doneProjects.length}
          </span>
        </div>

        {doneProjects.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma demanda concluída ainda.</p>
        ) : (
          <div className="relative ml-2">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-primary/20" />
            <div className="space-y-4">
              {doneProjects.map((project) => (
                <div key={project.id} className="relative pl-6">
                  <div className="absolute left-0 top-0.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{project.name}</p>
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium mt-0.5">
                    {projectTypeConfig[project.type]?.label}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar name={project.responsible} size="sm" />
                    <span className="text-xs text-muted-foreground">{project.responsible}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(project.deadline), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 p-4 pb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Observações</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
          {observations.map((obs) => (
            <div key={obs.id} className="bg-muted/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={obs.author} size="sm" />
                <span className="text-xs font-semibold text-foreground">{obs.author}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {format(obs.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {obs.text && (
                <p className="text-xs text-muted-foreground leading-relaxed">{obs.text}</p>
              )}
              {/* Attachments display */}
              {obs.attachments && obs.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {obs.attachments.map((att, i) =>
                    att.type.startsWith('image/') ? (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/30 transition-all"
                      >
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      </a>
                    ) : (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate max-w-[100px]">{att.name}</span>
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="px-3 pt-2 flex flex-wrap gap-2">
            {pendingFiles.map((file, i) => (
              <div key={i} className="relative group">
                {file.type.startsWith('image/') ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border">
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-background text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 text-primary" />
                    <span className="truncate max-w-[80px]">{file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removePendingFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-border flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Anexar arquivo"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddObservation()}
            placeholder="Adicionar observação..."
            className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          <button
            onClick={handleAddObservation}
            disabled={!newNote.trim() && pendingFiles.length === 0}
            className="px-3 py-2 gradient-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
