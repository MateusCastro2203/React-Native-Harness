// Tokens simples de cor/tipografia/espaçamento compartilhados pelos componentes.
// Mantém coerência visual entre Price, ProductCard, QtyStepper, CartRow e
// StateView sem depender de um ThemeProvider (styled-components/native v6).
// Identificadores em EN; prosa em PT-BR (ver CLAUDE.md §c).

export const colors = {
  background: '#ffffff',
  surface: '#f5f5f7',
  border: '#e0e0e3',
  text: '#1c1c1e',
  textMuted: '#6e6e73',
  primary: '#0a84ff',
  primaryText: '#ffffff',
  danger: '#ff3b30',
  disabled: '#c7c7cc',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const typography = {
  small: 12,
  body: 14,
  title: 16,
  price: 18,
  heading: 20,
} as const;

export const radius = {
  sm: 6,
  md: 10,
} as const;
