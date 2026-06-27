import type { ListRenderItem } from 'react-native';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import type { Product } from '../../src/types';
import { useProducts } from '../../src/hooks/useProducts';
import ProductCard from '../../src/components/ProductCard';
import StateView from '../../src/components/StateView';
import { colors, radius, spacing, typography } from '../../src/components/theme';

// Tela de BUSCA — versão BASE, propositadamente mínima.
//
// Busca por nome, filtro por categoria e ordenação por preço são FEATURES de
// tickets futuros (DEMO-2 / DEMO-3 / DEMO-4) e NÃO são implementadas aqui. Esta
// tela apenas reusa o hook de produtos (useProducts) e o ProductCard para
// mostrar o catálogo completo, com um placeholder visível anunciando que a
// busca e os filtros chegam em breve. Quando os tickets forem resolvidos, o
// placeholder dá lugar à barra de busca / chips de categoria / controle de
// ordenação. Ver specs/tickets/DEMO-2..DEMO-4 e specs/project.md §4–§6.

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const PlaceholderBanner = styled.View`
  margin-vertical: ${spacing.lg}px;
  padding: ${spacing.lg}px;
  background-color: ${colors.surface};
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${radius.md}px;
`;

const PlaceholderTitle = styled.Text`
  font-size: ${typography.title}px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: ${spacing.xs}px;
`;

const PlaceholderHint = styled.Text`
  font-size: ${typography.body}px;
  color: ${colors.textMuted};
`;

const CardSpacer = styled.View`
  margin-bottom: ${spacing.md}px;
`;

// Estilo do contentContainer da FlatList. styled-components é só para JSX, então
// o padding da lista (que não é um componente) fica em um objeto nomeado.
const listContentStyle = {
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
} as const;

/**
 * Catálogo completo, sem recorte. A busca de verdade (nome/categoria/preço)
 * pertence aos tickets DEMO-2/3/4; aqui só mostramos o placeholder + a lista.
 */
export default function SearchScreen() {
  const { products, loading, error, reload } = useProducts();

  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <CardSpacer>
      <ProductCard product={item} />
    </CardSpacer>
  );

  if (loading) {
    return (
      <Screen edges={['top']}>
        <StateView state="loading" message="Loading products…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top']}>
        <StateView
          state="error"
          message="Couldn't load products."
          onRetry={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <FlatList<Product>
        data={products}
        keyExtractor={(product) => product.id}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          <PlaceholderBanner accessibilityRole="summary">
            <PlaceholderTitle>Search</PlaceholderTitle>
            <PlaceholderHint>
              Search and filters coming soon (DEMO-2/3/4)
            </PlaceholderHint>
          </PlaceholderBanner>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <StateView state="empty" message="No products yet." />
        }
      />
    </Screen>
  );
}
