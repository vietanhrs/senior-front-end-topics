import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconReload } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}
interface State {
  error: Error | null;
}

/**
 * Lazy chunks can fail to load (offline, or the hashed file 404s after a new
 * deploy). A lazy component should be wrapped in an Error Boundary so we can
 * show a recoverable fallback instead of a blank screen.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ChunkErrorBoundary]', error.message, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <Stack gap="xs" p="md" className="rounded-md border border-red-300">
          <Text fw={600} c="red">
            Không tải được chunk
          </Text>
          <Text size="sm" c="dimmed">
            {this.state.error.message}
          </Text>
          <Group>
            <Button size="xs" leftSection={<IconReload size={14} />} onClick={this.reset}>
              Thử lại
            </Button>
          </Group>
        </Stack>
      );
    }
    return this.props.children;
  }
}
