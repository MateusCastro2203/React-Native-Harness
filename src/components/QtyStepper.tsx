import styled from 'styled-components/native';
import { colors, radius, spacing, typography } from './theme';

// QtyStepper: controle [ - | quantidade | + ] para UMA linha do carrinho.
// Não conhece o store; apenas dispara onDecrement/onIncrement. A tela (ou o
// CartRow) decide o efeito (ex.: updateQty). `min` evita decrementar abaixo de
// um piso (default 1); ao chegar no piso o botão "-" fica desabilitado.

export interface QtyStepperProps {
  /** Quantidade atual exibida no centro. */
  quantity: number;
  /** Chamado ao tocar em "-" (só quando quantity > min). */
  onDecrement: () => void;
  /** Chamado ao tocar em "+". */
  onIncrement: () => void;
  /** Piso da quantidade; abaixo dele "-" fica desabilitado. Default: 1. */
  min?: number;
}

const Wrapper = styled.View`
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${radius.sm}px;
  overflow: hidden;
`;

const StepButton = styled.TouchableOpacity<{ $disabled: boolean }>`
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) =>
    props.$disabled ? colors.surface : colors.background};
`;

const StepLabel = styled.Text<{ $disabled: boolean }>`
  font-size: ${typography.heading}px;
  font-weight: 600;
  color: ${(props) => (props.$disabled ? colors.disabled : colors.primary)};
`;

const QuantityText = styled.Text`
  min-width: 40px;
  text-align: center;
  font-size: ${typography.title}px;
  font-weight: 600;
  color: ${colors.text};
  padding-horizontal: ${spacing.sm}px;
`;

export default function QtyStepper({
  quantity,
  onDecrement,
  onIncrement,
  min = 1,
}: QtyStepperProps) {
  const decrementDisabled = quantity <= min;

  return (
    <Wrapper>
      <StepButton
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={decrementDisabled}
        $disabled={decrementDisabled}
        onPress={onDecrement}
      >
        <StepLabel $disabled={decrementDisabled}>−</StepLabel>
      </StepButton>

      <QuantityText>{quantity}</QuantityText>

      <StepButton
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        $disabled={false}
        onPress={onIncrement}
      >
        <StepLabel $disabled={false}>+</StepLabel>
      </StepButton>
    </Wrapper>
  );
}
