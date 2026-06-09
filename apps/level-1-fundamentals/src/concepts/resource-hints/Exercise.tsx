import { List, Stack, ThemeIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const scenarios = [
  'A. The page uses Google Fonts (fonts loaded from fonts.gstatic.com).',
  'B. The hero image is the LCP element, but its URL is only known from JS after the app runs.',
  'C. After the user logs in, they are almost certain to visit /dashboard.',
  'D. A woff2 web font declared in a CSS file, needed to render text on the first screen.',
  'E. You have 8 third-party origins, but only 1 is used immediately on load.',
];

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: pick the right resource hint for each situation">
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

      <Callout kind="tip" title="Before revealing the solution">
        Ask yourself: is this resource for the <i>current page</i> or a <i>later page</i>? Do you
        need a <i>connection</i> or the <i>resource itself</i>? Does it need high priority?
      </Callout>

      <SolutionReveal
        language="text"
        notes="Answers & reasoning:"
        code={`A → preconnect to https://fonts.gstatic.com (crossorigin), plus
     dns-prefetch as a fallback. We're SURE we'll fetch from that origin,
     so open DNS+TCP+TLS ahead of time.

B → preload as=image + fetchpriority="high". The LCP image is discovered
     late (in JS), so preload pulls it forward at high priority.

C → prefetch the /dashboard chunk/route. This is a FUTURE navigation,
     low priority, cached for next time.

D → preload as=font type=font/woff2 crossorigin. The font is needed
     immediately for first paint, otherwise FOUT/FOIT. (Fonts are always
     fetched in CORS mode → crossorigin.)

E → ONLY preconnect the origin used immediately (1). Don't preconnect the
     other 7 (wasted connections); at most dns-prefetch them.`}
      />
    </Stack>
  );
}
