import type { CartItem } from '../types';
import Price from './Price';
import QtyStepper from './QtyStepper';
import { colors, radius, spacing, typography } from './theme';
import styled from 'styled-components/native';

// CartRow: uma linha do carrinho. Exibe imagem + nome do produto, o Price da
// LINHA (price * quantity, em centavos), o QtyStepper e um botão de remover.
// É "burro": delega a mudança de quantidade e a remoção via callbacks. A tela
// liga `onChangeQty` a updateQty(productId, qty) e `onRemove` a remove(id).

export interface CartRowProps {
  /** Item do carrinho (produto + quantidade). */
  item: CartItem;
  /** Nova quantidade desejada para esta linha (já calculada). */
  onChangeQty: (quantity: number) => void;
  /** Remover a linha inteira. */
  onRemove: () => void;
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

const Thumbnail = styled.Image`
  width: 56px;
  height: 56px;
  border-radius: ${radius.sm}px;
  background-color: ${colors.surface};
  margin-right: ${spacing.md}px;
`;

const Details = styled.View`
  flex: 1;
  margin-right: ${spacing.md}px;
`;

const ProductName = styled.Text`
  font-size: ${typography.body}px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: ${spacing.xs}px;
`;

const Controls = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.sm}px;
`;

const RemoveButton = styled.TouchableOpacity`
  margin-left: ${spacing.md}px;
`;

const RemoveLabel = styled.Text`
  font-size: ${typography.small}px;
  font-weight: 600;
  color: ${colors.danger};
`;

export default function CartRow({ item, onChangeQty, onRemove }: CartRowProps) {
  const lineTotal = item.product.price * item.quantity;

  return (
    <Row>
      <Thumbnail
        source={{ uri: item.product.imageUrl }}
        resizeMode="cover"
        accessibilityLabel={item.product.name}
      />
      <Details>
        <ProductName numberOfLines={2}>{item.product.name}</ProductName>
        <Price cents={lineTotal} size={typography.title} />
        <Controls>
          <QtyStepper
            quantity={item.quantity}
            onDecrement={() => onChangeQty(item.quantity - 1)}
            onIncrement={() => onChangeQty(item.quantity + 1)}
          />
          <RemoveButton
            accessibilityRole="button"
            accessibilityLabel="Remove item"
            onPress={onRemove}
          >
            <RemoveLabel>Remove</RemoveLabel>
          </RemoveButton>
        </Controls>
      </Details>
    </Row>
  );
}
