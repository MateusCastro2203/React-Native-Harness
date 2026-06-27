import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { colors, radius, spacing, typography } from './theme';

// StateView: estados reutilizáveis de tela — Loading, Error (com retry) e Empty.
// As telas (catálogo, busca, carrinho, detalhe) consomem estes componentes em
// vez de duplicar UI de borda. Exporta os três componentes NOMEADOS e um
// default `StateView` de conveniência que escolhe via prop `state`.

const Centered = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xl}px;
`;

const Message = styled.Text`
  margin-top: ${spacing.md}px;
  font-size: ${typography.body}px;
  color: ${colors.textMuted};
  text-align: center;
`;

const RetryButton = styled.TouchableOpacity`
  margin-top: ${spacing.lg}px;
  background-color: ${colors.primary};
  border-radius: ${radius.sm}px;
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.xl}px;
`;

const RetryLabel = styled.Text`
  color: ${colors.primaryText};
  font-size: ${typography.body}px;
  font-weight: 600;
`;

export interface LoadingStateProps {
  /** Mensagem opcional abaixo do spinner. Default: "Loading…". */
  message?: string;
}

/** Estado de carregamento: spinner + mensagem. */
export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <Centered accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={colors.primary} />
      <Message>{message}</Message>
    </Centered>
  );
}

export interface ErrorStateProps {
  /** Mensagem de erro. Default: "Something went wrong.". */
  message?: string;
  /** Callback de "Try again". Se ausente, o botão de retry não aparece. */
  onRetry?: () => void;
}

/** Estado de erro: mensagem + botão "Try again" (quando onRetry é passado). */
export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Centered accessibilityRole="alert">
      <Message>{message}</Message>
      {onRetry ? (
        <RetryButton
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRetry}
        >
          <RetryLabel>Try again</RetryLabel>
        </RetryButton>
      ) : null}
    </Centered>
  );
}

export interface EmptyStateProps {
  /** Mensagem do estado vazio. Default: "Nothing here yet.". */
  message?: string;
}

/** Estado vazio: mensagem neutra. */
export function EmptyState({ message = 'Nothing here yet.' }: EmptyStateProps) {
  return (
    <Centered>
      <Message>{message}</Message>
    </Centered>
  );
}

export type StateViewProps =
  | ({ state: 'loading' } & LoadingStateProps)
  | ({ state: 'error' } & ErrorStateProps)
  | ({ state: 'empty' } & EmptyStateProps);

/**
 * Conveniência: escolhe o estado via prop discriminada `state`.
 * Ex.: <StateView state="error" message="..." onRetry={reload} />.
 */
export default function StateView(props: StateViewProps) {
  switch (props.state) {
    case 'loading':
      return <LoadingState message={props.message} />;
    case 'error':
      return <ErrorState message={props.message} onRetry={props.onRetry} />;
    case 'empty':
      return <EmptyState message={props.message} />;
  }
}
