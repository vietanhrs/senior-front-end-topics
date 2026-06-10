import { List, Stack, ThemeIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const scenarios = [
  'A. From https://app.example.com you embed an <iframe src="https://widget.example.com"> and call iframe.contentWindow.document — it throws. Why, and how do you communicate instead?',
  'B. A teammate "fixes" A by setting document.domain = "example.com" on both pages. Evaluate.',
  'C. fetch("https://api.example.com/me", { credentials: "include" }) returns 200 in the Network tab, but response.json() rejects / data is empty in JS. What\'s happening?',
  'D. You add a window message listener: window.addEventListener("message", e => applyConfig(e.data)). What\'s the security bug?',
  'E. You want to read pixel data from a cross-origin <img> onto a <canvas> (toDataURL) and it throws "tainted canvas". How do you make it work?',
];

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: reason about five cross-origin situations">
        <List
          spacing="xs"
          icon={<ThemeIcon color="indigo" size={20} radius="xl"><IconQuestionMark size={12} /></ThemeIcon>}
        >
          {scenarios.map((s) => (
            <List.Item key={s}>{s}</List.Item>
          ))}
        </List>
      </DemoCard>

      <Callout kind="tip" title="Before revealing">
        For each: is it blocked because of <i>origin</i> mismatch? Is the fix an opt-in (CORS /
        postMessage / crossorigin attribute), and what validation does it require?
      </Callout>

      <SolutionReveal
        language="text"
        notes="Answers & reasoning:"
        code={`A → Different host (app vs widget subdomain) = different ORIGIN, so SOP blocks DOM
     access. Communicate with postMessage:
       widget: parent.postMessage({type:'resize',h}, 'https://app.example.com')
       app:    window.addEventListener('message', e => {
                 if (e.origin !== 'https://widget.example.com') return;  // validate!
                 ...
               })

B → Reject. document.domain is deprecated and disabled under cross-origin
     isolation (and is itself a security smell — it widens the trust boundary to
     the whole domain). Use postMessage with explicit origin checks instead.

C → SOP: the request was sent and the server responded (hence 200 in Network),
     but JS may not READ a cross-origin response without CORS. /me must return
     Access-Control-Allow-Origin: https://app.example.com (+ Allow-Credentials:
     true, and NOT '*', because credentials:'include'). Without it the browser
     hides the body from JS.

D → It never validates e.origin (or e.source). ANY page that opened/embedded you
     can postMessage arbitrary config. Fix:
       if (e.origin !== TRUSTED_ORIGIN) return;
       // optionally also check e.source === expectedWindow
     Then validate the payload shape before applying.

E → The canvas is "tainted" because the image is cross-origin without CORS.
     Serve the image with Access-Control-Allow-Origin and load it with
     crossOrigin="anonymous" (img.crossOrigin = 'anonymous' BEFORE setting src).
     Then toDataURL()/getImageData() work because the pixels are CORS-clean.`}
      />
    </Stack>
  );
}
