import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import Price from '../../src/components/Price';
import StateView from '../../src/components/StateView';
import { colors, radius, spacing, typography } from '../../src/components/theme';
import { useCart } from '../../src/hooks/useCart';
import { useProduct } from '../../src/hooks/useProducts';
import type { Product } from '../../src/types';

// Tela de DETALHE do produto (rota dinâmica empilhada sobre as tabs).
// Lê o `id` do parâmetro de rota, busca o produto na fake API via `useProduct`
// (estados loading/error/reload) e oferece "adicionar ao carrinho" ligando em
// `useCart().add`. SafeArea é responsabilidade da tela; a formatação de moeda
// passa só pelo componente `Price`. Ver specs/project.md §4–5 e CLAUDE.md §c.

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const Content = styled.View`
  padding: ${spacing.lg}px;
`;

const ProductImage = styled.Image`
  width: 100%;
  height: 260px;
  border-radius: ${radius.md}px;
  background-color: ${colors.surface};
  margin-bottom: ${spacing.lg}px;
`;

const ProductName = styled.Text`
  font-size: ${typography.heading}px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: ${spacing.sm}px;
`;

const PriceRow = styled.View`
  margin-bottom: ${spacing.lg}px;
`;

const Description = styled.Text`
  font-size: ${typography.body}px;
  line-height: ${typography.body * 1.5}px;
  color: ${colors.textMuted};
  margin-bottom: ${spacing.xl}px;
`;

const AddButton = styled.TouchableOpacity<{ $disabled: boolean }>`
  background-color: ${(props) =>
    props.$disabled ? colors.disabled : colors.primary};
  border-radius: ${radius.sm}px;
  padding-vertical: ${spacing.md}px;
  align-items: center;
`;

const AddButtonLabel = styled.Text`
  color: ${colors.primaryText};
  font-size: ${typography.title}px;
  font-weight: 600;
`;

/** Detalhe do produto: busca por id, exibe dados e adiciona ao carrinho. */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading, error, reload } = useProduct(id);
  const { add } = useCart();

  if (loading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <StateView state="loading" message="Loading product…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top', 'bottom']}>
        <StateView
          state="error"
          message="Could not load this product."
          onRetry={reload}
        />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen edges={['top', 'bottom']}>
        <StateView state="empty" message="Product not found." />
      </Screen>
    );
  }

  const outOfStock = !product.inStock;

  const handleAdd = (item: Product) => {
    add(item);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Content>
          <ProductImage
            source={{ uri: product.imageUrl }}
            resizeMode="cover"
            accessibilityLabel={product.name}
          />
          <ProductName>{product.name}</ProductName>
          <PriceRow>
            <Price cents={product.price} size={typography.heading} />
          </PriceRow>
          <Description>{product.description}</Description>
          <AddButton
            accessibilityRole="button"
            accessibilityLabel={outOfStock ? 'Out of stock' : 'Add to cart'}
            $disabled={outOfStock}
            disabled={outOfStock}
            onPress={() => handleAdd(product)}
          >
            <AddButtonLabel>
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </AddButtonLabel>
          </AddButton>
        </Content>
      </ScrollView>
    </Screen>
  );
}
