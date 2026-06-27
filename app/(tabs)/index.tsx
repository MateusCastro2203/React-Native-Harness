import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import type { Product } from '../../src/types';
import { useProducts } from '../../src/hooks/useProducts';
import { useCart } from '../../src/hooks/useCart';
import ProductCard from '../../src/components/ProductCard';
import StateView from '../../src/components/StateView';
import { colors, spacing, typography } from '../../src/components/theme';

// Catálogo (tab "index"): grade de ProductCard alimentada por useProducts().
// Estados de borda (loading/error/empty) delegados a StateView. Tocar num card
// navega para product/[id]; o botão "Add to cart" usa a ação add do store via
// useCart(). SafeArea é responsabilidade da tela. Ver specs/project.md §4–5.

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const Heading = styled.Text`
  font-size: ${typography.heading}px;
  font-weight: 700;
  color: ${colors.text};
  padding-horizontal: ${spacing.lg}px;
  padding-top: ${spacing.md}px;
  padding-bottom: ${spacing.sm}px;
`;

const RowSpacer = styled.View`
  height: ${spacing.md}px;
`;

const NUM_COLUMNS = 2;

export default function CatalogScreen() {
  const router = useRouter();
  const { products, loading, error, reload } = useProducts();
  const { add } = useCart();

  const handleAdd = useCallback(
    (product: Product) => {
      add(product);
    },
    [add],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCardSlot>
        <ProductCard
          product={item}
          onPress={() => router.push(`/product/${item.id}`)}
          onAdd={handleAdd}
        />
      </ProductCardSlot>
    ),
    [router, handleAdd],
  );

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <StateView state="loading" message="Loading products…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <StateView
          state="error"
          message="Couldn't load products."
          onRetry={reload}
        />
      </Screen>
    );
  }

  if (products.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <StateView state="empty" message="No products available." />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Heading accessibilityRole="header">Catalog</Heading>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={contentContainerStyle}
        ItemSeparatorComponent={RowSpacer}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const ProductCardSlot = styled.View`
  flex: 1;
`;

const columnWrapperStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
} as const;

const contentContainerStyle = {
  paddingTop: spacing.sm,
  paddingBottom: spacing.xl,
} as const;
