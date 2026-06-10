import { List, Stack, ThemeIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const scenarios = [
  'A. Mobile users on lossy LTE report that on your h2 site, ALL images stall together whenever the connection hiccups. Why, and what transport change helps?',
  'B. A teammate proposes resurrecting domain sharding (img1.cdn.com … img4.cdn.com) "for parallelism" on your h2/h3 site. Evaluate.',
  'C. Your app does a TLS handshake to api.example.com on every cold start; product wants faster first-request latency for returning users. What does QUIC offer?',
  'D. Users on trains lose their upload when switching from Wi-Fi to 5G. Which QUIC feature addresses this, and how?',
  'E. After enabling h3 on the CDN, some corporate customers still negotiate h2. Why, and is it a problem?',
];

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: reason about transport behavior">
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
        For each: which layer is the bottleneck (HTTP, TLS, TCP/UDP)? What does QUIC change at that
        layer?
      </Callout>

      <SolutionReveal
        language="text"
        notes="Answers & reasoning:"
        code={`A → TCP head-of-line blocking. h2 multiplexes all streams over one TCP
     connection; one lost packet stalls the entire ordered byte stream, so every
     image freezes. HTTP/3/QUIC gives each stream independent ordering — only
     the stream that lost a packet waits. Enable h3 on the CDN.

B → Reject. On h2/h3 one connection already multiplexes unlimited parallel
     streams; sharding splits requests across MORE connections, each paying its
     own handshake + congestion-control warmup, and defeats prioritization.
     Sharding was an HTTP/1.1 workaround.

C → Faster handshakes. QUIC integrates TLS 1.3: 1-RTT for new connections
     (vs 2–3 RTTs for TCP+TLS), and 0-RTT resumption for returning clients —
     the first request can ride along with the handshake. Pair with preconnect.

D → Connection migration. QUIC connections are identified by a connection ID,
     not the (IP, port) tuple. When the device's IP changes (Wi-Fi → 5G), the
     same connection continues — the upload survives without re-handshaking.

E → Their networks block UDP/443 (or middleboxes interfere), so the browser
     falls back to h2 via Alt-Svc negotiation. Not a problem: fallback is
     automatic and semantics are identical — h3 is a progressive enhancement.
     Don't build anything that REQUIRES h3.`}
      />
    </Stack>
  );
}
