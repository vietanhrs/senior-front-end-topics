import { List, Stack, ThemeIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const scenarios = [
  'A. Users clicking links to your app from Slack/Gmail land on the login page, but they ARE logged in once they navigate again. Your session cookie is SameSite=Strict. Diagnose & fix.',
  'B. Your OAuth SSO callback (idp.com redirects back to app.com/callback) loses the "state" cookie you set before redirecting out. Why, and what attribute does it need?',
  'C. A support-chat widget your customers embed in THEIR sites stopped seeing its session cookie. What must the cookie be — and what additional headwind exists even then?',
  'D. Security asks: "We set SameSite=Lax, so we can delete all CSRF tokens, right?"',
  'E. app.example.com and api.example.com — do API fetches need SameSite=None for cookies to flow? What about foo.github.io calling bar.github.io?',
];

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: diagnose five real SameSite incidents">
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
        For each: is the request cross-SITE (not just cross-origin)? Is it a top-level GET? Which
        mode's rules explain the behavior?
      </Callout>

      <SolutionReveal
        language="text"
        notes="Answers & reasoning:"
        code={`A → Strict withholds the cookie on cross-site TOP-LEVEL navigations too, so the
     first arrival from Slack/Gmail has no session. Fix: make the session cookie
     SameSite=Lax (sent on top-level GET). If you want Strict-grade protection,
     keep a second Strict cookie for sensitive actions only.

B → The redirect back from idp.com is a cross-site navigation (often a POST in
     OIDC form_post!). A Lax cookie survives a GET callback; a POST callback
     needs SameSite=None; Secure on the state/nonce cookie. (This is the classic
     "SSO broke when browsers defaulted to Lax" incident.)

C → Embedded iframe = cross-site subresource → the cookie must be
     SameSite=None; Secure. Even then, third-party cookie phase-outs
     (Safari/Firefox already, Chrome policies evolving) may block it: plan for
     CHIPS (Partitioned) cookies or the Storage Access API.

D → No. Lax kills the classic auto-POST CSRF, but: subdomain takeovers are
     same-site (SameSite doesn't help), some flows need None cookies, old
     browsers differ, and the Lax+POST 2-minute window existed in Chrome.
     Keep CSRF tokens / Origin checks for state-changing endpoints. Layers.

E → example.com subdomains are the SAME site → SameSite never blocks those
     fetches (you still need CORS + credentials:'include'). github.io is on the
     Public Suffix List, so foo.github.io and bar.github.io are DIFFERENT sites
     → that call needs SameSite=None cookies (and CORS).`}
      />
    </Stack>
  );
}
