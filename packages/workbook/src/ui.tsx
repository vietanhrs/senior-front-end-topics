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
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import {
  IconAlertTriangle,
  IconBulb,
  IconChecklist,
  IconDeviceDesktopAnalytics,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconRepeat,
  IconScale,
  IconTestPipe,
  IconTerminal2,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

export const EXERCISE_ACCEPTANCE_CRITERIA = [
  {
    id: 'unit-test',
    label: 'Unit test',
    detail: 'Cover the smallest pure behavior, including the happy path and at least one boundary condition.',
  },
  {
    id: 'e2e-test',
    label: 'E2E scenario',
    detail: 'Describe one user-visible flow that would catch the regression in a browser-level test.',
  },
  {
    id: 'performance-budget',
    label: 'Performance budget',
    detail: 'Set a measurable budget such as render count, network requests, blocking time, memory, or bundle impact.',
  },
  {
    id: 'failure-case',
    label: 'Failure case',
    detail: 'Name the error mode the fix must survive: race, retry, stale data, invalid input, slow network, or cleanup leak.',
  },
  {
    id: 'trade-off',
    label: 'Trade-off explanation',
    detail: 'Explain why this fix is preferable and what cost it introduces for maintainability or runtime behavior.',
  },
] as const;

const criterionIcons: Record<(typeof EXERCISE_ACCEPTANCE_CRITERIA)[number]['id'], ReactNode> = {
  'unit-test': <IconTestPipe size={18} />,
  'e2e-test': <IconDeviceDesktopAnalytics size={18} />,
  'performance-budget': <IconChecklist size={18} />,
  'failure-case': <IconRepeat size={18} />,
  'trade-off': <IconScale size={18} />,
};

export function ExerciseContract() {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group gap="xs">
          <Badge color="indigo" variant="light">
            Senior exercise contract
          </Badge>
          <Text size="sm" c="dimmed">
            Treat the solution as complete only when these review points are answered.
          </Text>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {EXERCISE_ACCEPTANCE_CRITERIA.map((criterion) => (
            <Paper key={criterion.id} withBorder radius="sm" p="sm">
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <Badge color="teal" variant="light" p={6}>
                  {criterionIcons[criterion.id]}
                </Badge>
                <Stack gap={2}>
                  <Text size="sm" fw={700}>
                    {criterion.label}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {criterion.detail}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

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
