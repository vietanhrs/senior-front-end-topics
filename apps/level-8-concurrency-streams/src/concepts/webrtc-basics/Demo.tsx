import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const supported = typeof RTCPeerConnection !== 'undefined';

interface ChatMsg {
  from: 'A' | 'B';
  text: string;
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const pcA = useRef<RTCPeerConnection | null>(null);
  const pcB = useRef<RTCPeerConnection | null>(null);
  const dcA = useRef<RTCDataChannel | null>(null);
  const dcB = useRef<RTCDataChannel | null>(null);
  const [state, setState] = useState('new');
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState('hello peer 👋');
  const [chat, setChat] = useState<ChatMsg[]>([]);

  const teardown = () => {
    pcA.current?.close();
    pcB.current?.close();
    pcA.current = pcB.current = null;
    dcA.current = dcB.current = null;
  };
  useEffect(() => () => teardown(), []);

  const connect = async () => {
    if (!supported) return;
    teardown();
    clear();
    setChat([]);
    setConnected(false);

    const a = new RTCPeerConnection();
    const b = new RTCPeerConnection();
    pcA.current = a;
    pcB.current = b;

    // The page is the signaling channel: trickle each peer's ICE candidates
    // straight into the other.
    a.onicecandidate = (e) => {
      if (e.candidate) {
        b.addIceCandidate(e.candidate).catch(() => {});
        log(`A→B ICE candidate (${e.candidate.type ?? 'host'})`, 'micro');
      }
    };
    b.onicecandidate = (e) => {
      if (e.candidate) {
        a.addIceCandidate(e.candidate).catch(() => {});
        log(`B→A ICE candidate (${e.candidate.type ?? 'host'})`, 'micro');
      }
    };
    a.onconnectionstatechange = () => {
      setState(a.connectionState);
      log(`A connectionState: ${a.connectionState}`, 'macro');
    };

    // A creates the data channel; B receives it via ondatachannel.
    const channelA = a.createDataChannel('chat', { ordered: true });
    dcA.current = channelA;
    channelA.onopen = () => {
      setConnected(true);
      log('DataChannel open on A — peer-to-peer, encrypted (DTLS)', 'success');
    };
    channelA.onmessage = (e) => setChat((c) => [...c, { from: 'B', text: e.data }]);

    b.ondatachannel = (e) => {
      const channelB = e.channel;
      dcB.current = channelB;
      channelB.onmessage = (ev) => {
        setChat((c) => [...c, { from: 'A', text: ev.data }]);
        channelB.send(`echo: ${ev.data}`); // B echoes back to A
      };
    };

    // Offer / answer SDP exchange (handed across directly).
    const offer = await a.createOffer();
    await a.setLocalDescription(offer);
    log('A: createOffer → setLocalDescription → (signal offer to B)', 'sync');
    await b.setRemoteDescription(offer);
    const answer = await b.createAnswer();
    await b.setLocalDescription(answer);
    log('B: setRemoteDescription(offer) → createAnswer → setLocalDescription', 'sync');
    await a.setRemoteDescription(answer);
    log('A: setRemoteDescription(answer) — negotiation done, ICE checking…', 'sync');
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !dcA.current || dcA.current.readyState !== 'open') return;
    dcA.current.send(text);
    setChat((c) => [...c, { from: 'A', text }]);
    setDraft('');
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="A real WebRTC connection — two peers, no server">
        Two <code>RTCPeerConnection</code>s in this page connect to each other: the page relays their
        offer/answer SDP and trickles ICE candidates between them (host candidates, loopback). Once
        the <code>RTCDataChannel</code> opens, messages travel peer-to-peer and B echoes them back.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="WebRTC unavailable here">
          <code>RTCPeerConnection</code> isn't present in this environment, so the live connection
          can't run. The code and flow in the theory + exercise still apply.
        </Callout>
      )}

      <Group>
        <Button onClick={connect} disabled={!supported}>Connect peers</Button>
        <Badge variant="light" color={connected ? 'teal' : 'gray'}>connectionState: {state}</Badge>
      </Group>

      <DemoCard title="Peer-to-peer chat (A → B → echo back to A)">
        <Stack gap="xs">
          <Group>
            <TextInput
              flex={1}
              value={draft}
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="type a message"
              disabled={!connected}
            />
            <Button onClick={send} disabled={!connected}>Send over DataChannel</Button>
          </Group>
          <div className="rounded-md border p-2" style={{ minHeight: 80 }}>
            {chat.length === 0 ? (
              <Text size="sm" c="dimmed">Connect, then send a message.</Text>
            ) : (
              <Stack gap={4}>
                {chat.map((m, i) => (
                  <Group key={i} gap="xs">
                    <Badge size="xs" color={m.from === 'A' ? 'indigo' : 'teal'} variant="light">
                      peer {m.from}
                    </Badge>
                    <Text size="sm">{m.text}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </div>
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Press Connect to watch the offer/answer + ICE exchange." />
    </Stack>
  );
}
