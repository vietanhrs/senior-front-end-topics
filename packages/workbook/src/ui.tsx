import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Code,
  Collapse,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import {
  IconAlertTriangle,
  IconBulb,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconTerminal2,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

/** A collapsible "show solution" block used by exercises. */
export function SolutionReveal({
  code,
  language = 'tsx',
  notes,
}: {
  code: string;
  language?: string;
  notes?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap="xs">
      <Button
        variant="light"
        color="teal"
        leftSection={open ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        onClick={() => setOpen((o) => !o)}
        w="fit-content"
      >
        {open ? 'Hide solution' : 'Show solution'}
      </Button>
      <Collapse in={open}>
        <Stack gap="xs">
          {notes && (
            <Text size="sm" c="dimmed">
              {notes}
            </Text>
          )}
          <CodeHighlight code={code} language={language} radius="md" withCopyButton />
        </Stack>
      </Collapse>
    </Stack>
  );
}

/** A bordered section used to frame a single experiment inside a demo. */
export function DemoCard({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" mb={description ? 4 : 'sm'}>
        <Title order={4}>{title}</Title>
        {right}
      </Group>
      {description && (
        <Text c="dimmed" size="sm" mb="sm">
          {description}
        </Text>
      )}
      {children}
    </Paper>
  );
}

type CalloutKind = 'info' | 'warning' | 'tip';

const calloutConfig: Record<CalloutKind, { color: string; icon: ReactNode }> = {
  info: { color: 'blue', icon: <IconInfoCircle size={18} /> },
  warning: { color: 'orange', icon: <IconAlertTriangle size={18} /> },
  tip: { color: 'teal', icon: <IconBulb size={18} /> },
};

export function Callout({
  kind = 'info',
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  const cfg = calloutConfig[kind];
  return (
    <Alert variant="light" color={cfg.color} icon={cfg.icon} title={title}>
      {children}
    </Alert>
  );
}

export interface LogEntry {
  id: number;
  text: string;
  tone?: 'default' | 'sync' | 'micro' | 'macro' | 'success' | 'error';
}

const toneColor: Record<NonNullable<LogEntry['tone']>, string> = {
  default: 'gray',
  sync: 'blue',
  micro: 'grape',
  macro: 'orange',
  success: 'teal',
  error: 'red',
};

/**
 * Ordered append-only logger used by demos that need to make *execution order*
 * visible (event loop, async flows, lifecycle). Stable across re-renders.
 */
export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const idRef = useRef(0);

  const log = useCallback((text: string, tone: LogEntry['tone'] = 'default') => {
    setLogs((prev) => [...prev, { id: idRef.current++, text, tone }]);
  }, []);

  const clear = useCallback(() => setLogs([]), []);

  return { logs, log, clear };
}

export function LogConsole({
  logs,
  height = 220,
  empty = 'No output yet — run something.',
}: {
  logs: LogEntry[];
  height?: number;
  empty?: string;
}) {
  return (
    <Paper withBorder radius="md" bg="dark.8" c="gray.0">
      <Group gap={6} px="sm" py={6} bg="dark.6" style={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <IconTerminal2 size={16} />
        <Text size="xs" fw={600}>
          Console (execution order)
        </Text>
      </Group>
      <ScrollArea h={height} px="sm" py="xs">
        {logs.length === 0 ? (
          <Text size="sm" c="dimmed" ff="monospace">
            {empty}
          </Text>
        ) : (
          <Stack gap={2}>
            {logs.map((entry, i) => (
              <Group key={entry.id} gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" ff="monospace" w={28} ta="right">
                  {i + 1}.
                </Text>
                {entry.tone && entry.tone !== 'default' && (
                  <Badge size="xs" color={toneColor[entry.tone]} variant="filled">
                    {entry.tone}
                  </Badge>
                )}
                <Code bg="transparent" c="gray.0" style={{ fontSize: 12.5 }}>
                  {entry.text}
                </Code>
              </Group>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Paper>
  );
}
