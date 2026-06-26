import { List, Stack, ThemeIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const scenarios = [
  'A. A controlled <input> value while the user types in a search box.',
  'B. Re-rendering a 5,000-row results table as the search query changes.',
  'C. A tab switch that mounts a heavy panel; you want the old tab to stay until the new one is ready.',
  'D. A live-updating value from a third-party hook you do not control the setter of.',
  'E. Forcing the DOM to update synchronously before measuring an element with getBoundingClientRect.',
];

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: choose the right scheduling API for each case">
        <List
          spacing="xs"
          icon={
            <ThemeIcon color="indigo" size={20} radius="xl">
              <IconQuestionMark size={12} />
            </ThemeIcon>
          }
        >
          {scenarios.map((s) => (
            <List.Item key={s}>{s}</List.Item>
          ))}
        </List>
      </DemoCard>

      <Callout kind="tip" title="Before revealing">
        Ask: must this feel instant (urgent) or can it lag (transition/deferred)? Do I own the
        setter? Do I need a synchronous commit?
      </Callout>

      <SolutionReveal
        language="text"
        notes="Answers & reasoning:"
        code={`A → default setState (urgent). The input value MUST update on every keystroke.
     Never wrap a controlled input's value in a transition.

B → useTransition or useDeferredValue. Keep setQuery urgent, then transition
     the cheap state that drives the expensive table render. Do not run the
     expensive CPU work directly inside startTransition's callback.

C → useTransition. Keep rendering the old tab; show isPending while the new
     heavy panel is prepared, then swap. Avoids a jarring blank/spinner.

D → useDeferredValue(value). You don't own the setter, so defer the value:
     React renders with the old value, then re-renders at low priority.

E → flushSync(() => setState(...)) then measure. You need the DOM committed
     synchronously before reading layout. (Rare — opts out of batching/concurrency.)`}
      />
    </Stack>
  );
}
