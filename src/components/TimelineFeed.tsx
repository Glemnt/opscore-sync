import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type TimelineEvent, EVENT_TYPE_CONFIG } from '@/hooks/useTimelineQuery';

interface TimelineFeedProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  showPlatformFilter?: boolean;
  platformNames?: Record<string, string>;
}

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_CONFIG).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

export function TimelineFeed({ events, isLoading, showPlatformFilter, platformNames }: TimelineFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = events;
    if (typeFilter) result = result.filter(e => e.eventType === typeFilter);
    if (platformFilter) result = result.filter(e => e.platformId === platformFilter);
    return result;
  }, [events, typeFilter, platformFilter]);

  const uniquePlatforms = useMemo(() => {
    const ids = new Set(events.filter(e => e.platformId).map(e => e.platformId!));
    return Array.from(ids);
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <span className="text-sm">Carregando timeline...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filters toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{filtered.length} evento{filtered.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="w-3 h-3" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-background border border-input rounded-md text-foreground"
          >
            <option value="">Todos os tipos</option>
            {EVENT_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {showPlatformFilter && uniquePlatforms.length > 0 && (
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="h-7 px-2 text-xs bg-background border border-input rounded-md text-foreground"
            >
              <option value="">Todas plataformas</option>
              {uniquePlatforms.map(id => (
                <option key={id} value={id}>{platformNames?.[id] ?? id}</option>
              ))}
            </select>
          )}
          {(typeFilter || platformFilter) && (
            <button
              onClick={() => { setTypeFilter(''); setPlatformFilter(''); }}
              className="text-xs text-primary hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento registrado.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
          <div className="space-y-3">
            {filtered.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.eventType] ?? EVENT_TYPE_CONFIG.general_change;
              return (
                <div key={event.id} className="relative flex items-start gap-3 pl-0">
                  <div className={cn(
                    'relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs border',
                    config.color
                  )}>
                    {config.icon}
                  </div>
                  <div className="flex-1 bg-card rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium border', config.color)}>
                          {config.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{event.description}</p>
                    {(event.oldValue || event.newValue) && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        {event.oldValue && (
                          <span className="text-destructive line-through">{event.oldValue}</span>
                        )}
                        {event.oldValue && event.newValue && (
                          <span className="text-muted-foreground">→</span>
                        )}
                        {event.newValue && (
                          <span className="text-success">{event.newValue}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                      <span>por {event.triggeredBy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
