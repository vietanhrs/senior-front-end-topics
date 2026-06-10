import { useEffect, useState } from "react";
import { Badge, Group, Stack, Text } from "@mantine/core";
import { Callout, DemoCard, SolutionReveal } from "@sfe/workbook";

/**
 * BUGGY component (simulated): renders the current time directly during render.
 * In real SSR the server and client would compute different values → hydration
 * mismatch. Task: make the first render deterministic, then update after mount.
 */
function GreetingBuggy() {
  // ❌ Runs during render: under SSR this value differs between server & client
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    setDate(new Date().toLocaleTimeString());
  });

  return <Text>Hello! It's {date} right now.</Text>;
}

/** One correct solution, shown so you can compare after trying it yourself. */
function GreetingFixed() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    setNow(new Date().toLocaleTimeString()); // client only, AFTER hydration
  }, []);
  return <Text>Hello! It's {now ?? "…"} right now.</Text>;
}

const solution = `function Greeting() {
  // The first render returns a value that MATCHES the server (placeholder).
  const [now, setNow] = useState<string | null>(null);

  // useEffect doesn't run during SSR and runs AFTER hydration on the client,
  // so it can't cause a mismatch.
  useEffect(() => {
    setNow(new Date().toLocaleTimeString());
  }, []);

  return <Text>Hello! It's {now ?? '…'} right now.</Text>;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: kill the hydration mismatch"
        description="The component below renders the time directly during render → non-deterministic. Fix it so the first render matches the server, then update after mount with useEffect."
      >
        <Stack gap="sm">
          <Group>
            <Badge color="red" variant="light">
              Buggy
            </Badge>
            <GreetingBuggy />
          </Group>
          <Group>
            <Badge color="teal" variant="light">
              Fixed
            </Badge>
            <GreetingFixed />
          </Group>
        </Stack>
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Any browser-only value, or one that changes with time/locale, must go
        inside <code>useEffect</code> (which runs after hydration), not be
        computed directly during render.
      </Callout>

      <SolutionReveal code={solution} />
    </Stack>
  );
}
