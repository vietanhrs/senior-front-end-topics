# WebRTC basics

## What WebRTC is

**WebRTC** gives the browser **peer-to-peer**, low-latency, encrypted media and data — without a
server in the data path. It powers video calls, screen sharing, game netcode, and P2P file transfer.
Two browsers establish a direct connection and then exchange audio/video **tracks** or arbitrary
**data** over a `RTCDataChannel`. All of it is mandatorily encrypted (DTLS for data, SRTP for media).

The hard part isn't sending bytes — it's **getting two machines behind NATs/firewalls to find and
agree on a path to each other.** That's what the setup dance solves.

## The three jobs

### 1. Signaling (you build this)
WebRTC does **not** define how peers exchange setup info — you do, over any channel you already have
(WebSocket, HTTP, even a QR code). What you exchange is **SDP** (Session Description Protocol)
blobs describing codecs, media, and parameters:

```
A: createOffer() → setLocalDescription(offer) → send offer ──▶ B
B: setRemoteDescription(offer) → createAnswer() → setLocalDescription(answer) → send answer ──▶ A
A: setRemoteDescription(answer)
```

### 2. ICE — finding a path (NAT traversal)
**ICE** (Interactive Connectivity Establishment) gathers **candidates** (possible address:port
routes) and trickles them to the peer as they're found (`onicecandidate`). Candidate types:

- **host** — your LAN address (works for same-network / loopback).
- **srflx (server-reflexive)** — your public address as seen by a **STUN** server (NAT punch-through).
- **relay** — routed through a **TURN** server when direct connection is impossible (symmetric NAT,
  strict firewall). TURN costs bandwidth because it relays all traffic.

ICE pairs up local/remote candidates, runs connectivity checks, and picks the best working pair.

### 3. The connection & data
Once an ICE pair succeeds, DTLS handshakes and the channels open:

- **`RTCDataChannel`** — SCTP over DTLS. Configurable like TCP **or** UDP:
  `{ ordered: true }` (default, reliable+ordered) vs `{ ordered: false, maxRetransmits: 0 }`
  (unreliable, lowest latency — great for game state where only the latest matters).
- **Media tracks** — `addTrack(track, stream)` from `getUserMedia`/`getDisplayMedia`; the remote gets
  them via `ontrack`.

`pc.connectionState` walks `new → connecting → connected → (disconnected/failed/closed)`.

## A subtlety: you can run both peers in one page

Two `RTCPeerConnection`s in the *same* document can connect to each other — wire each one's
`onicecandidate` into the other's `addIceCandidate`, and pass the offer/answer across directly. The
page *is* the signaling channel. (That's exactly what this demo does — a real connection, no server,
using host candidates.)

## Senior checklist

- WebRTC = P2P encrypted media/data; **signaling is your responsibility**, ICE/STUN/TURN handle NAT
  traversal, DTLS/SRTP handle encryption.
- Flow: offer/answer SDP exchange → trickle ICE candidates → ICE picks a working pair → DTLS →
  channels open.
- `RTCDataChannel` is tunable reliable+ordered (TCP-like) or unreliable+unordered (UDP-like) per use
  case; media uses tracks (`addTrack`/`ontrack`).
- TURN is the fallback when direct fails — it relays (bandwidth cost); always provide STUN, and TURN
  for production reliability.

## References

- [MDN: WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [MDN: Signaling and video calling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [MDN: RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)
- [webrtc.org: architecture & ICE/STUN/TURN](https://webrtc.org/getting-started/peer-connections)
