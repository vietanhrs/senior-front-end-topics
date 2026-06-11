import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Tries to open a P2P data channel, but it never connects across real networks
// and the channel is "open" before it really is. Find the bugs.
async function connect(signaling) {
  const pc = new RTCPeerConnection();        // (1) no ICE servers → fails behind NAT

  const channel = pc.createDataChannel('game');
  channel.send('ready');                      // (2) sends immediately, before 'open'

  const offer = await pc.createOffer();
  signaling.send(offer);                      // (3) sent the offer without setLocalDescription
  // (4) nothing listens for remote ICE candidates from the peer
  // (5) no remote answer is ever applied

  return channel;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the connection setup"
        description="The peer connection skips local description, never applies the remote answer or ICE candidates, has no STUN/TURN for NAT traversal, and sends on the channel before it's open. Wire the full offer/answer + ICE flow."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Provide <code>iceServers</code> (STUN, and TURN for production). Do{' '}
        <code>createOffer → setLocalDescription → signal</code>; on the answer,{' '}
        <code>setRemoteDescription</code>. Trickle candidates both ways (<code>onicecandidate</code> →
        signal; incoming → <code>addIceCandidate</code>). Only <code>send()</code> from{' '}
        <code>channel.onopen</code>.
      </Callout>

      <SolutionReveal
        language="js"
        code={`async function connect(signaling) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },          // (1) NAT reflexive candidates
      // production: a TURN server as relay fallback
      // { urls: 'turn:turn.example.com', username: '…', credential: '…' },
    ],
  });

  // (4) trickle our candidates to the peer, and apply theirs as they arrive
  pc.onicecandidate = (e) => { if (e.candidate) signaling.send({ candidate: e.candidate }); };
  signaling.on('candidate', (c) => pc.addIceCandidate(c).catch(console.error));

  // (5) apply the remote answer when it comes back
  signaling.on('answer', (answer) => pc.setRemoteDescription(answer));

  const channel = pc.createDataChannel('game', { ordered: false, maxRetransmits: 0 }); // UDP-like
  const ready = new Promise((resolve) => {
    channel.onopen = () => { channel.send('ready'); resolve(); }; // (2) send only when open
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);   // (3) MUST set local desc before signaling
  signaling.send({ offer });

  await ready;
  return channel;
}

// The answerer side mirrors it: setRemoteDescription(offer) → createAnswer →
// setLocalDescription → signal({ answer }); plus the same ICE trickling.

// Why it's better: STUN/TURN make it work across NATs; the offer is signaled
// only after setLocalDescription; the remote answer and ICE candidates are
// applied both ways so ICE can find a path; and data is sent only once the
// channel is actually open. (unordered/maxRetransmits:0 = lowest-latency game data.)`}
      />
    </Stack>
  );
}
