import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../src/components/theme';

// Layout raiz do app (expo-router). Envolve toda a árvore em SafeAreaProvider
// para que as telas possam medir os insets via SafeAreaView. Não há
// ThemeProvider de styled-components: os tokens (cor/tipografia/espaçamento) são
// importados diretamente de src/components/theme.ts (ver manifestos).
//
// O Stack raiz declara dois nós: o grupo de abas (tabs) — que renderiza sua
// própria barra inferior — e a rota de detalhe product/[id]. O header nativo do
// Stack fica oculto no grupo de abas (a navegação fica a cargo das Tabs) e
// visível, com título, na tela de detalhe.

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
