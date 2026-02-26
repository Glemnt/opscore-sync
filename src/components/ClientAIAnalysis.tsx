import { useMemo } from 'react';
import { Brain, MessageCircle, Clock, TrendingUp, ListChecks, Star } from 'lucide-react';
import { Client, Task } from '@/types';
import { cn } from '@/lib/utils';

interface ClientAIAnalysisProps {
  client: Client;
  clientTasks: Task[];
}

// Mock AI analysis data per client
export const mockAnalysisData: Record<string, {
  satisfactionScore: number;
  avgResponseTime: string;
  projectSummary: string;
  weeklyNextSteps: string[];
  lastAnalysisDate: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}> = {
  c1: {
    satisfactionScore: 8.5,
    avgResponseTime: '2h 15min',
    projectSummary: 'Cliente engajado e respondendo bem às campanhas. Últimas semanas com bom ritmo de aprovações. Grupo de WhatsApp ativo com feedbacks construtivos. Calls semanais produtivas com foco em expansão para Meta Ads.',
    weeklyNextSteps: [
      'Enviar prévia das artes de verão para aprovação até quarta-feira',
      'Agendar call para alinhar estratégia de Meta Ads para março',
      'Responder dúvida sobre relatório de performance no grupo do WhatsApp',
      'Preparar proposta de ampliação de SKUs na Shopee',
    ],
    lastAnalysisDate: '2025-02-21',
    sentiment: 'positive',
  },
  c2: {
    satisfactionScore: 6.8,
    avgResponseTime: '4h 30min',
    projectSummary: 'Cliente demonstra certa insatisfação com prazos recentes. Tempo de resposta no WhatsApp acima do ideal. Na última call, mencionou preocupação com ROI das campanhas. Necessário atenção redobrada nas entregas.',
    weeklyNextSteps: [
      'Priorizar entrega dos anúncios atrasados da Shopee',
      'Enviar relatório comparativo de ROI para tranquilizar o cliente',
      'Reduzir tempo de resposta no WhatsApp — meta: abaixo de 2h',
      'Agendar call extraordinária para realinhamento de expectativas',
    ],
    lastAnalysisDate: '2025-02-21',
    sentiment: 'negative',
  },
  c3: {
    satisfactionScore: 7.2,
    avgResponseTime: '1h 45min',
    projectSummary: 'Cliente estável, porém com muitas demandas pendentes. Comunicação fluida no WhatsApp. Aguardando aprovação de lista de SKUs há mais de uma semana. Campanha do Dia das Mães precisa ser acelerada.',
    weeklyNextSteps: [
      'Cobrar aprovação da lista de SKUs de forma gentil',
      'Iniciar planejamento visual da campanha Dia das Mães',
      'Enviar cronograma atualizado com datas-chave',
      'Propor reunião quinzenal em vez de mensal dado volume de demandas',
    ],
    lastAnalysisDate: '2025-02-21',
    sentiment: 'neutral',
  },
  c4: {
    satisfactionScore: 9.2,
    avgResponseTime: '45min',
    projectSummary: 'Maior cliente e mais satisfeito. Comunicação excelente — respostas rápidas de ambos os lados. Calls produtivas com decisões claras. Estratégia Q1 alinhada com sucesso. Cliente elogiou a equipe na última reunião.',
    weeklyNextSteps: [
      'Finalizar criativos de Meta Ads para aprovação',
      'Monitorar performance das campanhas recém-lançadas',
      'Preparar dashboard personalizado com KPIs do cliente',
      'Explorar oportunidade de upsell em Google Ads',
    ],
    lastAnalysisDate: '2025-02-21',
    sentiment: 'positive',
  },
  c5: {
    satisfactionScore: 7.0,
    avgResponseTime: '3h 20min',
    projectSummary: 'Cliente em onboarding, ainda se adaptando ao fluxo. Poucas interações no WhatsApp até o momento. Aguardando acesso às contas para dar continuidade. Expectativas iniciais estão alinhadas.',
    weeklyNextSteps: [
      'Cobrar acessos pendentes (BM Meta, conta Shopee)',
      'Enviar guia de onboarding e boas-vindas formal',
      'Agendar primeira call estratégica pós-onboarding',
      'Criar cronograma das primeiras 4 semanas de operação',
    ],
    lastAnalysisDate: '2025-02-21',
    sentiment: 'neutral',
  },
  c6: {
    satisfactionScore: 5.0,
    avgResponseTime: '8h+',
    projectSummary: 'Cliente pausado com baixo engajamento. Respostas no WhatsApp muito lentas. Última call cancelada pelo cliente. Risco de churn se não houver reativação em breve.',
    weeklyNextSteps: [
      'Entrar em contato para entender status da reformulação interna',
      'Propor plano de reativação com condições especiais',
      'Preparar resumo do que foi feito antes da pausa',
      'Avaliar se faz sentido manter squad alocado ou realocar recursos',
    ],
    lastAnalysisDate: '2025-02-21',
    sentiment: 'negative',
  },
};

function ScoreGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const color = score >= 8 ? 'text-success' : score >= 6 ? 'text-warning' : 'text-destructive';
  const bgColor = score >= 8 ? 'bg-success/15' : score >= 6 ? 'bg-warning/15' : 'bg-destructive/15';
  const strokeColor = score >= 8 ? 'stroke-success' : score >= 6 ? 'stroke-warning' : 'stroke-destructive';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" className="stroke-border" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            className={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 213.6} 213.6`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', color)}>{score.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">de 10</span>
    </div>
  );
}

export function ClientAIAnalysis({ client, clientTasks }: ClientAIAnalysisProps) {
  const analysis = mockAnalysisData[client.id];

  if (!analysis) {
    return (
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Análise por IA</h4>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Análise não disponível para este cliente.
        </p>
      </div>
    );
  }

  const sentimentConfig = {
    positive: { label: 'Positivo', className: 'bg-success/15 text-success' },
    neutral: { label: 'Neutro', className: 'bg-warning/15 text-warning' },
    negative: { label: 'Atenção', className: 'bg-destructive/15 text-destructive' },
  };

  const sentiment = sentimentConfig[analysis.sentiment];

  return (
    <div className="px-6 py-4 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Análise por IA
          </h4>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', sentiment.className)}>
            {sentiment.label}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Atualizado: {new Date(analysis.lastAnalysisDate).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Satisfaction score */}
        <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Satisfação
            </span>
          </div>
          <ScoreGauge score={analysis.satisfactionScore} />
        </div>

        {/* Response time */}
        <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageCircle className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tempo Resposta
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{analysis.avgResponseTime}</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">média no WhatsApp</span>
        </div>

        {/* Pending tasks count */}
        <div className="bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Demandas
            </span>
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">
            {clientTasks.filter(t => t.status !== 'done').length}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1">pendentes</span>
        </div>
      </div>

      {/* Project summary */}
      <div className="bg-muted/40 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Resumo do Projeto</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.projectSummary}</p>
      </div>

      {/* Weekly next steps */}
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
        <div className="flex items-center gap-1.5 mb-3">
          <ListChecks className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Próximos Passos da Semana</span>
        </div>
        <ul className="space-y-2">
          {analysis.weeklyNextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
