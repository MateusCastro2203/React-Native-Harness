import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '../../src/components/theme';

// Layout das abas (expo-router Tabs). Três abas, na ordem:
//   - Catalog (index)  → lista de produtos
//   - Search  (search) → busca
//   - Cart    (cart)   → carrinho
// Ícones de @expo/vector-icons (Ionicons), que já vem incluído no Expo. A
// tab ativa usa colors.primary; a inativa, colors.textMuted. O header de cada
// aba fica visível com o título correspondente; o Stack raiz oculta seu próprio
// header neste grupo (ver app/_layout.tsx).

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
