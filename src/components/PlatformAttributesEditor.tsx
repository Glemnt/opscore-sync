import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// ─── Definitions ───

export type AttrFieldType = 'select' | 'toggle';

export interface AttrFieldDef {
  key: string;
  label: string;
  type: AttrFieldType;
  options?: { value: string; label: string }[];
}

export const PLATFORM_ATTRIBUTE_DEFINITIONS: Record<string, AttrFieldDef[]> = {
  mercado_livre: [
    {
      key: 'reputacao',
      label: 'Reputação',
      type: 'select',
      options: [
        { value: '', label: '—' },
        { value: 'verde', label: '🟢 Verde' },
        { value: 'amarelo', label: '🟡 Amarelo' },
        { value: 'laranja', label: '🟠 Laranja' },
        { value: 'vermelho', label: '🔴 Vermelho' },
      ],
    },
    {
      key: 'medalha',
      label: 'Medalha',
      type: 'select',
      options: [
        { value: '', label: '—' },
        { value: 'sem_medalha', label: 'Sem Medalha' },
        { value: 'lider', label: 'Líder' },
        { value: 'gold', label: 'Gold' },
        { value: 'platinum', label: 'Platinum' },
        { value: 'loja_oficial', label: 'Loja Oficial' },
      ],
    },
    {
      key: 'envios',
      label: 'Envios',
      type: 'select',
      options: [
        { value: '', label: '—' },
        { value: 'full', label: 'Full' },
        { value: 'flex', label: 'Flex' },
        { value: 'turbo', label: 'Turbo' },
      ],
    },
  ],
  shopee: [
    { key: 'vendedor_indicado', label: 'Vendedor Indicado', type: 'toggle' },
    { key: 'shopee_express', label: 'Shopee Express', type: 'toggle' },
    { key: 'shopee_entrega_direta', label: 'Shopee Entrega Direta', type: 'toggle' },
    { key: 'full_shopee', label: 'Full Shopee', type: 'toggle' },
  ],
  shein: [
    {
      key: 'reputacao',
      label: 'Reputação',
      type: 'select',
      options: [
        { value: '', label: '—' },
        { value: 'L1', label: 'L1' },
        { value: 'L2', label: 'L2' },
        { value: 'L3', label: 'L3' },
        { value: 'L4', label: 'L4' },
        { value: 'L5', label: 'L5' },
      ],
    },
  ],
};

// ─── Summary badges helper ───

const REPUTACAO_EMOJI: Record<string, string> = {
  verde: '🟢', amarelo: '🟡', laranja: '🟠', vermelho: '🔴',
};

const MEDALHA_LABEL: Record<string, string> = {
  sem_medalha: 'Sem Medalha', lider: 'Líder', gold: 'Gold', platinum: 'Platinum', loja_oficial: 'Loja Oficial',
};

export function getPlatformAttributeSummary(slug: string, attrs: Record<string, any>): string[] {
  if (!attrs || Object.keys(attrs).length === 0) return [];
  const parts: string[] = [];

  if (slug === 'mercado_livre') {
    if (attrs.reputacao) parts.push(REPUTACAO_EMOJI[attrs.reputacao] ?? attrs.reputacao);
    if (attrs.medalha) parts.push(MEDALHA_LABEL[attrs.medalha] ?? attrs.medalha);
    if (attrs.envios) parts.push(attrs.envios.charAt(0).toUpperCase() + attrs.envios.slice(1));
  } else if (slug === 'shopee') {
    if (attrs.vendedor_indicado) parts.push('Indicado');
    if (attrs.shopee_express) parts.push('Express');
    if (attrs.shopee_entrega_direta) parts.push('Direta');
    if (attrs.full_shopee) parts.push('Full');
  } else if (slug === 'shein') {
    if (attrs.reputacao) parts.push(attrs.reputacao);
  }

  return parts;
}

// ─── Editor Component ───

interface PlatformAttributesEditorProps {
  platformSlug: string;
  attributes: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function PlatformAttributesEditor({ platformSlug, attributes, onChange }: PlatformAttributesEditorProps) {
  const fields = PLATFORM_ATTRIBUTE_DEFINITIONS[platformSlug];
  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atributos Operacionais</p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((field) => {
          if (field.type === 'select') {
            return (
              <div key={field.key}>
                <label className="text-[10px] text-muted-foreground uppercase">{field.label}</label>
                <select
                  value={attributes[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md text-foreground"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === 'toggle') {
            return (
              <div key={field.key} className="flex items-center justify-between gap-2 py-1">
                <Label className="text-xs font-normal text-foreground">{field.label}</Label>
                <Switch
                  checked={!!attributes[field.key]}
                  onCheckedChange={(val) => onChange(field.key, val)}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
