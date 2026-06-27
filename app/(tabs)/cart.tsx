import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import CartRow from '../../src/components/CartRow';
import Price from '../../src/components/Price';
import { EmptyState } from '../../src/components/StateView';
import { colors, spacing, typography } from '../../src/components/theme';
import { useCart } from '../../src/hooks/useCart';
import type { CartItem } from '../../src/types';

// Tela CARRINHO (rota de tab). Lista os itens via CartRow, ligando os callbacks
// ao store (useCart): mudar quantidade -> updateQty(id, qty) (que já remove ao
// chegar em 0) e remover -> remove(id). O rodapé mostra Subtotal e Total VINDOS
// DO STORE (subtotal/total) — formatados só pelo componente Price.
//
// DEMO-1 (narrativa): quando há cupom aplicado, o rodapé exibe um campo
// INFORMATIVO de "subtotal com desconto" calculado AQUI NA TELA
// (subtotal - desconto). Isso é puramente visual: NÃO altera o store. O
// subtotal()/total() do store continuam como estão — total() segue bugado de
// propósito (ignora o cupom). O campo de inserir cupom ainda NÃO existe (é o
// ticket DEMO-1); aqui só lemos o cupom já presente no estado.

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const ListContent = styled.View`
  padding-horizontal: ${spacing.lg}px;
`;

const Footer = styled.View`
  padding-horizontal: ${spacing.lg}px;
  padding-vertical: ${spacing.lg}px;
  border-top-width: 1px;
  border-top-color: ${colors.border};
  background-color: ${colors.background};
`;

const SummaryRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.sm}px;
`;

const TotalRow = styled(SummaryRow)`
  margin-top: ${spacing.sm}px;
  margin-bottom: 0px;
`;

const Label = styled.Text`
  font-size: ${typography.body}px;
  color: ${colors.textMuted};
`;

const TotalLabel = styled.Text`
  font-size: ${typography.title}px;
  font-weight: 600;
  color: ${colors.text};
`;

const CouponNote = styled.Text`
  font-size: ${typography.small}px;
  color: ${colors.textMuted};
  margin-bottom: ${spacing.sm}px;
`;

export default function CartScreen() {
  const { items, coupon, subtotal, total, updateQty, remove } = useCart();

  // Campo informativo de DEMO-1: subtotal com desconto, calculado SÓ na tela.
  // Não toca no store; serve apenas para evidenciar a narrativa do cupom.
  const discountedSubtotal =
    coupon !== null
      ? Math.round(subtotal * (1 - coupon.discountPercent / 100))
      : null;

  if (items.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState message="Your cart is empty." />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <FlatList<CartItem>
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <ListContent>
            <CartRow
              item={item}
              onChangeQty={(quantity) => updateQty(item.product.id, quantity)}
              onRemove={() => remove(item.product.id)}
            />
          </ListContent>
        )}
      />
      <Footer>
        <SummaryRow>
          <Label>Subtotal</Label>
          <Price cents={subtotal} size={typography.body} color={colors.text} />
        </SummaryRow>

        {coupon !== null && discountedSubtotal !== null ? (
          <SummaryRow>
            <Label>{`Subtotal with coupon (${coupon.code}, -${coupon.discountPercent}%)`}</Label>
            <Price
              cents={discountedSubtotal}
              size={typography.body}
              color={colors.textMuted}
            />
          </SummaryRow>
        ) : null}

        {coupon !== null ? (
          <CouponNote>Informational only — total is unchanged.</CouponNote>
        ) : null}

        <TotalRow>
          <TotalLabel>Total</TotalLabel>
          <Price cents={total} size={typography.price} color={colors.text} />
        </TotalRow>
      </Footer>
    </Screen>
  );
}
