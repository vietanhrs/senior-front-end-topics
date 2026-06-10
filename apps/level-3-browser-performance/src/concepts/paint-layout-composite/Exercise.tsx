import { List, Stack, ThemeIcon } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `/* A drawer that slides in, plus a pulsing notification dot.
   It animates layout-triggering properties → janky on low-end devices.
   Rewrite both animations to stay on the composite-only path. */
.drawer {
  left: -320px;
  transition: left 250ms ease;            /* animates layout */
}
.drawer.open { left: 0; }

.badge {
  width: 12px; height: 12px;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%   { width: 12px; height: 12px; }     /* animates layout */
  50%  { width: 18px; height: 18px; }
  100% { width: 12px; height: 12px; }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: move these animations onto the composite-only path"
        description="The drawer animates `left` and the badge animates width/height — both force layout (and paint) every frame. Rewrite using transform/opacity so they only re-composite."
      >
        <List
          spacing={4}
          mb="sm"
          icon={
            <ThemeIcon color="indigo" size={18} radius="xl">
              <IconQuestionMark size={11} />
            </ThemeIcon>
          }
        >
          <List.Item>Slide the drawer with transform, not left.</List.Item>
          <List.Item>Pulse the badge by scaling, not resizing.</List.Item>
        </List>
        <CodeHighlight code={buggy} language="css" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Translate instead of offsetting; scale instead of resizing. <code>transform</code> and{' '}
        <code>opacity</code> are the only two properties the compositor can animate without layout
        or paint. Add <code>will-change: transform</code> to pre-promote the layer.
      </Callout>

      <SolutionReveal
        language="css"
        code={`.drawer {
  transform: translateX(-320px);          /* composite-only */
  transition: transform 250ms ease;
  will-change: transform;                 /* hint: promote ahead of the animation */
}
.drawer.open { transform: translateX(0); }

.badge {
  width: 12px; height: 12px;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%   { transform: scale(1); }           /* scale instead of resizing */
  50%  { transform: scale(1.5); }
  100% { transform: scale(1); }
}

/* Why: transform/opacity animate on the GPU compositor thread — no reflow, no
   repaint of the element's contents. They keep 60fps even under main-thread load.
   Use will-change sparingly (each promoted layer costs GPU memory). */`}
      />
    </Stack>
  );
}
