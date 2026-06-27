import styled from 'styled-components/native';
import { colors, typography } from './theme';

// Componente Price: ÚNICO ponto de formatação de moeda do app.
// Recebe valor em CENTAVOS (inteiro, como em Product.price / cart subtotal e
// total) e exibe em BRL (ex.: 19900 => "R$ 199,00"). Ver CLAUDE.md §c (a
// formatação de moeda acontece só na UI, neste componente).

export interface PriceProps {
  /** Valor em CENTAVOS (inteiro). Ex.: 19900 => R$ 199,00. */
  cents: number;
  /** Tamanho da fonte (px). Default: typography.price. */
  size?: number;
  /** Cor do texto. Default: colors.text. */
  color?: string;
}

const PriceText = styled.Text<{ $size: number; $color: string }>`
  font-size: ${(props) => props.$size}px;
  font-weight: 600;
  color: ${(props) => props.$color};
`;

/** Formata centavos (inteiro) para string BRL, ex.: 19900 -> "R$ 199,00". */
function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function Price({
  cents,
  size = typography.price,
  color = colors.text,
}: PriceProps) {
  return (
    <PriceText $size={size} $color={color}>
      {formatBRL(cents)}
    </PriceText>
  );
}
