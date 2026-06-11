import { useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type Tag = 'button' | 'a' | 'input' | 'img' | 'div';

interface Config {
  tag: Tag;
  text: string;
  ariaLabel: string;
  ariaLabelledby: string;
  alt: string;
  role: string;
  ariaHidden: boolean;
}

const IMPLICIT: Record<Tag, string> = {
  button: 'button',
  a: 'link',
  input: 'textbox',
  img: 'img',
  div: 'generic',
};

const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'menuitem', 'option', 'tab']);
const CONTROL_ROLES = new Set(['button', 'link', 'textbox', 'checkbox', 'menuitem', 'tab']);

function compute(c: Config) {
  const role = c.role.trim() || IMPLICIT[c.tag];
  let name = '';
  let source = 'none';

  if (c.ariaLabelledby.trim()) {
    name = c.ariaLabelledby.trim();
    source = 'aria-labelledby';
  } else if (c.ariaLabel.trim()) {
    name = c.ariaLabel.trim();
    source = 'aria-label';
  } else if (c.tag === 'img') {
    if (c.alt.trim()) {
      name = c.alt.trim();
      source = 'alt';
    }
  } else if (c.tag === 'input') {
    // native name would come from a <label>; not modeled here beyond aria-*
  } else if (NAME_FROM_CONTENT.has(role) && c.text.trim()) {
    name = c.text.trim();
    source = 'text content';
  }

  let inTree = true;
  let prunedReason = '';
  if (c.ariaHidden) {
    inTree = false;
    prunedReason = 'aria-hidden="true"';
  } else if (c.tag === 'img' && !c.alt.trim() && !c.ariaLabel.trim() && !c.ariaLabelledby.trim()) {
    inTree = false;
    prunedReason = 'img with alt="" → decorative';
  }

  const warnings: string[] = [];
  if (inTree && CONTROL_ROLES.has(role) && !name) {
    warnings.push(`${role} has NO accessible name — unusable for screen readers`);
  }
  if (c.tag === 'div' && !c.role.trim()) {
    warnings.push('a bare <div> is role "generic" — not a control, not focusable, no keyboard');
  }
  if (c.role.trim() && c.tag === 'div' && CONTROL_ROLES.has(c.role.trim())) {
    warnings.push(`role="${c.role.trim()}" obligates you to add tabindex + keyboard handlers + states yourself`);
  }
  if (c.ariaHidden && (c.tag === 'button' || c.tag === 'a')) {
    warnings.push('aria-hidden on a focusable element creates a focusable but nameless "ghost"');
  }

  return { role, name, source, inTree, prunedReason, warnings };
}

function markup(c: Config) {
  const attrs: string[] = [];
  if (c.role.trim()) attrs.push(`role="${c.role.trim()}"`);
  if (c.ariaLabel.trim()) attrs.push(`aria-label="${c.ariaLabel.trim()}"`);
  if (c.ariaLabelledby.trim()) attrs.push(`aria-labelledby="lbl"`);
  if (c.ariaHidden) attrs.push('aria-hidden="true"');
  if (c.tag === 'img') attrs.push(`alt="${c.alt}"`);
  const a = attrs.length ? ' ' + attrs.join(' ') : '';
  if (c.tag === 'img') return `<img${a} src="…" />`;
  if (c.tag === 'input') return `<input${a} />`;
  return `<${c.tag}${a}>${c.text}</${c.tag}>`;
}

const PRESETS: Record<string, Config> = {
  'Icon button (no label)': { tag: 'button', text: '', ariaLabel: '', ariaLabelledby: '', alt: '', role: '', ariaHidden: false },
  'Labeled icon button': { tag: 'button', text: '', ariaLabel: 'Close', ariaLabelledby: '', alt: '', role: '', ariaHidden: false },
  'Decorative image': { tag: 'img', text: '', ariaLabel: '', ariaLabelledby: '', alt: '', role: '', ariaHidden: false },
  'Informative image': { tag: 'img', text: '', ariaLabel: '', ariaLabelledby: '', alt: 'Q3 sales chart', role: '', ariaHidden: false },
  'div as button': { tag: 'div', text: 'Submit', ariaLabel: '', ariaLabelledby: '', alt: '', role: '', ariaHidden: false },
  'div + role=button': { tag: 'div', text: 'Submit', ariaLabel: 'Submit', ariaLabelledby: '', alt: '', role: 'button', ariaHidden: false },
  'Unlabeled input': { tag: 'input', text: '', ariaLabel: '', ariaLabelledby: '', alt: '', role: '', ariaHidden: false },
};

export function Demo() {
  const [c, setC] = useState<Config>(PRESETS['Icon button (no label)']);
  const set = (patch: Partial<Config>) => setC((prev) => ({ ...prev, ...patch }));
  const result = compute(c);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Build markup, see the accessibility node it produces">
        Pick a preset or tweak the attributes and watch the computed <b>role</b>, <b>accessible
        name</b> (and which accname rule won), and whether the node is even <b>in the tree</b>. This
        models the accname priority: aria-labelledby → aria-label → native (alt/text) → none.
      </Callout>

      <Group gap="xs">
        {Object.keys(PRESETS).map((k) => (
          <Button key={k} size="xs" variant="light" onClick={() => setC(PRESETS[k])}>{k}</Button>
        ))}
      </Group>

      <Group grow align="flex-start">
        <Stack gap="xs">
          <div>
            <Text size="sm" fw={500} mb={4}>element</Text>
            <SegmentedControl
              fullWidth
              value={c.tag}
              onChange={(v) => set({ tag: v as Tag })}
              data={['button', 'a', 'input', 'img', 'div']}
            />
          </div>
          {c.tag !== 'img' && c.tag !== 'input' && (
            <TextInput label="text content" value={c.text} onChange={(e) => set({ text: e.currentTarget.value })} />
          )}
          {c.tag === 'img' && (
            <TextInput label='alt (empty = decorative)' value={c.alt} onChange={(e) => set({ alt: e.currentTarget.value })} />
          )}
          <TextInput label="aria-label" value={c.ariaLabel} onChange={(e) => set({ ariaLabel: e.currentTarget.value })} />
          <TextInput label="aria-labelledby (referenced text)" value={c.ariaLabelledby} onChange={(e) => set({ ariaLabelledby: e.currentTarget.value })} />
          <TextInput label="role override" value={c.role} onChange={(e) => set({ role: e.currentTarget.value })} />
          <Switch label='aria-hidden="true"' checked={c.ariaHidden} onChange={(e) => set({ ariaHidden: e.currentTarget.checked })} />
        </Stack>

        <Stack gap="sm">
          <DemoCard title="Markup">
            <Text size="sm" ff="monospace">{markup(c)}</Text>
          </DemoCard>
          <DemoCard title="Accessibility node">
            {result.inTree ? (
              <Stack gap={6}>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">role</Text>
                  <Badge variant="light" color="indigo">{result.role}</Badge>
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">name</Text>
                  {result.name ? (
                    <Badge variant="light" color="teal">"{result.name}"</Badge>
                  ) : (
                    <Badge variant="light" color="red">(no accessible name)</Badge>
                  )}
                  <Text size="xs" c="dimmed">from: {result.source}</Text>
                </Group>
              </Stack>
            ) : (
              <Badge color="gray" variant="light">pruned from tree — {result.prunedReason}</Badge>
            )}
          </DemoCard>
          {result.warnings.length > 0 && (
            <Callout kind="warning" title="Issues">
              <Stack gap={2}>
                {result.warnings.map((w, i) => (
                  <Text key={i} size="sm">• {w}</Text>
                ))}
              </Stack>
            </Callout>
          )}
        </Stack>
      </Group>
    </Stack>
  );
}
