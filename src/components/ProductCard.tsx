import type { Product } from '../types';
import Price from './Price';
import { colors, radius, spacing, typography } from './theme';
import styled from 'styled-components/native';

// ProductCard: card do catálogo. Mostra imagem (imageUrl), nome, Price e um
// botão "Add to cart". É "burro": não conhece o store. A tela passa callbacks:
// `onPress` (abrir detalhe) e `onAdd` (adicionar ao carrinho). Quando o produto
// está fora de estoque (inStock === false), o botão de adicionar fica
// desabilitado e exibe "Out of stock".

export interface ProductCardProps {
  /** Produto a exibir. */
  product: Product;
  /** Toque no card (ex.: navegar para o detalhe). Opcional. */
  onPress?: () => void;
  /** Toque no botão "Add to cart". Recebe o próprio produto. Opcional. */
  onAdd?: (product: Product) => void;
}

const CardWrapper = styled.TouchableOpacity`
  background-color: ${colors.background};
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${radius.md}px;
  overflow: hidden;
`;

const ProductImage = styled.Image`
  width: 100%;
  height: 140px;
  background-color: ${colors.surface};
`;

const InfoSection = styled.View`
  padding: ${spacing.md}px;
`;

const ProductName = styled.Text`
  font-size: ${typography.title}px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: ${spacing.xs}px;
`;

const PriceRow = styled.View`
  margin-bottom: ${spacing.md}px;
`;

const AddButton = styled.TouchableOpacity<{ $disabled: boolean }>`
  background-color: ${(props) =>
    props.$disabled ? colors.disabled : colors.primary};
  border-radius: ${radius.sm}px;
  padding-vertical: ${spacing.sm}px;
  align-items: center;
`;

const AddButtonLabel = styled.Text`
  color: ${colors.primaryText};
  font-size: ${typography.body}px;
  font-weight: 600;
`;

export default function ProductCard({
  product,
  onPress,
  onAdd,
}: ProductCardProps) {
  const outOfStock = !product.inStock;

  return (
    <CardWrapper
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={onPress}
      disabled={!onPress}
    >
      <ProductImage
        source={{ uri: product.imageUrl }}
        resizeMode="cover"
        accessibilityLabel={product.name}
      />
      <InfoSection>
        <ProductName numberOfLines={2}>{product.name}</ProductName>
        <PriceRow>
          <Price cents={product.price} />
        </PriceRow>
        <AddButton
          accessibilityRole="button"
          accessibilityLabel={outOfStock ? 'Out of stock' : 'Add to cart'}
          $disabled={outOfStock}
          disabled={outOfStock}
          onPress={() => onAdd?.(product)}
        >
          <AddButtonLabel>
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </AddButtonLabel>
        </AddButton>
      </InfoSection>
    </CardWrapper>
  );
}
