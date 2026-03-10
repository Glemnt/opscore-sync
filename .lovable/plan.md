

## Plano: Remover campos desnecessários dos Detalhes da Plataforma

### Alteração

**`src/components/PlatformDetailModal.tsx`** (linhas 180-250)

Remover os seguintes dropdowns do grid:
- Fase (linhas 181-190)
- Squad Operacional (linhas 191-201)
- Responsável (linhas 202-212)
- Tempo de Contrato (linhas 213-224)
- Nível de Qualidade (linhas 225-236)

Manter apenas:
- Saúde da Plataforma (linhas 237-249)
- Atributos operacionais via `PlatformAttributesEditor` (Reputação, Medalha, Full, Flex, Turbo — já existente abaixo do grid)

O grid passará a ter apenas 1 item, então será ajustado para `grid-cols-1` ou substituído por um `div` simples.

