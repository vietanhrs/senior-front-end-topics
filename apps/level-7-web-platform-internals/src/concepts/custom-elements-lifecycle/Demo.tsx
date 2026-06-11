import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';
import { ensureDefined, lifecycleBus, TAG } from './element';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const hostA = useRef<HTMLDivElement | null>(null);
  const hostB = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<HTMLElement | null>(null);
  const [defined, setDefined] = useState(false);
  const [alive, setAlive] = useState(false);
  const labelN = useRef(0);

  useEffect(() => {
    const off = lifecycleBus.on((msg, tone) => log(msg, tone));
    return () => void off();
  }, [log]);
  useEffect(() => () => elRef.current?.remove(), []);

  function define() {
    ensureDefined();
    setDefined(true);
  }
  function createConnect() {
    if (!hostA.current || elRef.current) return;
    const el = document.createElement(TAG);
    el.setAttribute('label', `v${++labelN.current}`);
    elRef.current = el;
    hostA.current.appendChild(el); // → connectedCallback
    setAlive(true);
  }
  function changeAttr() {
    elRef.current?.setAttribute('label', `v${++labelN.current}`); // → attributeChangedCallback
  }
  function setUnobserved() {
    elRef.current?.setAttribute('data-x', String(Date.now())); // NOT observed → no callback
    log('set data-x (not in observedAttributes) → attributeChangedCallback did NOT fire', 'sync');
  }
  function move() {
    if (elRef.current && hostB.current) hostB.current.appendChild(elRef.current); // re-parent → disconnect + connect
  }
  function remove() {
    elRef.current?.remove(); // → disconnectedCallback
    elRef.current = null;
    setAlive(false);
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Drive a real custom element's lifecycle">
        Define the element, then create/connect it, change its observed <code>label</code> attribute
        (fires <code>attributeChangedCallback</code>) vs an unobserved one (doesn't), move it between
        hosts (fires <code>disconnected</code> then <code>connected</code>), and remove it. Every
        callback logs below.
      </Callout>

      <DemoCard
        title="Controls"
        right={
          <Group gap="xs">
            <Badge color={defined ? 'teal' : 'gray'} variant="light">{defined ? 'defined' : 'not defined'}</Badge>
            <Badge color={alive ? 'teal' : 'gray'} variant="light">{alive ? 'in DOM' : 'detached'}</Badge>
          </Group>
        }
      >
        <Group gap="xs">
          <Button size="xs" onClick={define} disabled={defined}>customElements.define()</Button>
          <Button size="xs" onClick={createConnect} disabled={!defined || alive}>create + connect</Button>
          <Button size="xs" variant="light" onClick={changeAttr} disabled={!alive}>change label (observed)</Button>
          <Button size="xs" variant="light" onClick={setUnobserved} disabled={!alive}>set data-x (unobserved)</Button>
          <Button size="xs" variant="light" onClick={move} disabled={!alive}>move to host B</Button>
          <Button size="xs" color="red" variant="light" onClick={remove} disabled={!alive}>remove</Button>
          <Button size="xs" variant="subtle" onClick={clear}>clear log</Button>
        </Group>

        <Group grow mt="md" align="stretch">
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" mb={4}>Host A</Text>
            <div ref={hostA} />
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" mb={4}>Host B</Text>
            <div ref={hostB} />
          </Paper>
        </Group>
      </DemoCard>

      <LogConsole logs={logs} height={190} empty="Define the element, then create/connect it." />
    </Stack>
  );
}
