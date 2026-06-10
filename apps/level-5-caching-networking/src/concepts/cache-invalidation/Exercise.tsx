import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A hand-rolled API cache with three invalidation bugs:
//  (1) after adding a todo it clears the WHOLE cache,
//  (2) renaming a todo invalidates the detail entry but NOT the list that embeds it,
//  (3) failed responses get cached like successes.
const cache = new Map();

async function getCached(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  const data = await res.json();          // (3) even when res.ok === false
  cache.set(url, data);
  return data;
}

async function addTodo(todo) {
  await fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) });
  cache.clear();                           // (1) nukes users, settings, everything
}

async function renameTodo(id, title) {
  await fetch('/api/todos/' + id, { method: 'PATCH', body: JSON.stringify({ title }) });
  cache.delete('/api/todos/' + id);        // (2) list '/api/todos' still stale
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the invalidation strategy"
        description="Make invalidation precise: only the affected keys, including derived/list entries; and never cache failed responses."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Think in terms of a dependency map: a todo mutation affects the detail key AND every list
        key that contains it. Check <code>res.ok</code> before caching. A prefix-based invalidation
        helper (<code>invalidate('/api/todos')</code> drops the list + all details) mirrors how
        React Query invalidates by key prefix.
      </Callout>

      <SolutionReveal
        language="js"
        code={`const cache = new Map();

async function getCached(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status); // (3) don't cache failures
  const data = await res.json();
  cache.set(url, data);
  return data;
}

// Invalidate by key PREFIX — drops the list and every dependent detail entry,
// and nothing else (users/settings keep their hits).
function invalidate(prefix) {
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(prefix + '/') || key.startsWith(prefix + '?')) {
      cache.delete(key);
    }
  }
}

async function addTodo(todo) {
  await fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) });
  invalidate('/api/todos');                // (1) only todo-related keys
}

async function renameTodo(id, title) {
  await fetch('/api/todos/' + id, { method: 'PATCH', body: JSON.stringify({ title }) });
  invalidate('/api/todos');                // (2) detail AND the embedding list
}

// Production: this is exactly React Query's model —
//   useQuery({ queryKey: ['todos'] }) / ['todos', id]
//   onSuccess: queryClient.invalidateQueries({ queryKey: ['todos'] })
// Keys form the dependency graph; mutations invalidate by prefix.`}
      />
    </Stack>
  );
}
