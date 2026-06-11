import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Code, Group, Paper, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

export function Demo() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ShadowRoot | null>(null);
  const [closed, setClosed] = useState(false);
  const [attached, setAttached] = useState(false);
  const [shadowRootVisible, setShadowRootVisible] = useState<string>('—');

  // A page-level style that tries (and fails) to restyle shadow content.
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `.sd-compare p { color: var(--mantine-color-blue-6); font-weight:700; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  function attach() {
    const host = hostRef.current;
    if (!host || attached) return;
    const root = host.attachShadow({ mode: closed ? 'closed' : 'open' });
    rootRef.current = root;
    root.innerHTML = `
      <style>
        p { color: #e8590c; font-weight: 700; margin: 0 0 6px; }   /* scoped to this shadow only */
        ::slotted(.tag) { background: gold; color:#000; padding: 1px 6px; border-radius: 4px; }
        button[part="cta"] { all: unset; cursor: pointer; color: #099268; text-decoration: underline; }
      </style>
      <p>Inside shadow DOM — orange via the shadow's own &lt;style&gt;. The page's
         ".sd-compare p { color: blue }" does NOT reach me.</p>
      <slot></slot>
      <div><button part="cta">a ::part(cta) the page may theme</button></div>`;

    // light-DOM child projected through the <slot>
    const slotted = document.createElement('span');
    slotted.className = 'tag';
    slotted.textContent = 'projected from light DOM via <slot>';
    host.appendChild(slotted);

    setAttached(true);
    setShadowRootVisible(host.shadowRoot ? 'host.shadowRoot = [object ShadowRoot]' : 'host.shadowRoot = null (closed)');
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Real shadow DOM, live">
        Attaching a shadow root encapsulates its DOM and CSS. The blue page rule below restyles the
        <b> light-DOM</b> paragraph but can't touch the shadow's paragraph (which stays orange). Try
        the closed mode and watch <Code>host.shadowRoot</Code> become <Code>null</Code>.
      </Callout>

      <Group justify="space-between">
        <Switch label="mode: 'closed' (hide host.shadowRoot)" checked={closed} onChange={(e) => setClosed(e.currentTarget.checked)} disabled={attached} />
        <Badge variant="light">{shadowRootVisible}</Badge>
      </Group>

      <DemoCard
        title="Host element + comparison light DOM"
        right={<Button size="xs" onClick={attach} disabled={attached}>attachShadow()</Button>}
      >
        <Stack gap="sm" className="sd-compare">
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" mb={4}>Light DOM (page CSS applies → blue):</Text>
            <p>This paragraph is in the light DOM — the page rule paints it blue & bold.</p>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" mb={4}>Shadow host (its subtree is encapsulated):</Text>
            <div ref={hostRef}>
              {!attached && <p>Not yet a shadow host — this light-DOM text is blue (page CSS). Click attachShadow().</p>}
            </div>
          </Paper>
        </Stack>
        <Text size="xs" c="dimmed" mt="sm">
          After attaching: the shadow's <Code>&lt;p&gt;</Code> is orange (its own style), the page's
          blue rule is blocked at the boundary, and the gold pill is light-DOM content projected
          through the <Code>&lt;slot&gt;</Code>.
        </Text>
      </DemoCard>
    </Stack>
  );
}
