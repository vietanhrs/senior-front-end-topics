# HTTP/3 and QUIC

## The lineage, in one diagram

```
HTTP/1.1   ─ 1 request per TCP connection at a time (browsers open ~6 in parallel)
HTTP/2     ─ many streams multiplexed over ONE TCP connection (+ header compression HPACK)
HTTP/3     ─ many streams over QUIC (UDP-based), TLS 1.3 built in, QPACK headers
```

Each generation attacks the previous one's bottleneck.

## HTTP/2's achilles heel: TCP head-of-line blocking

HTTP/2 multiplexes streams over **one TCP connection** — great until a **packet is lost**. TCP
guarantees in-order delivery of *the whole byte stream*, so one lost packet stalls **every**
HTTP/2 stream behind it, even streams whose packets all arrived:

```
TCP byte stream:  [A1][B1][A2][LOST B2][A3]…
                              ▲ TCP holds A3 (and everything) until B2 is retransmitted
→ stream A is blocked by stream B's loss: head-of-line (HoL) blocking at the transport layer
```

On lossy networks (mobile!), HTTP/2 can perform *worse* than HTTP/1.1's six independent
connections.

## QUIC: rebuilding the transport on UDP

**QUIC** is a transport protocol on top of **UDP** that re-implements TCP's guarantees
**per-stream** instead of per-connection:

- **Independent streams**: loss in stream B delays only stream B. Streams A/C keep delivering.
  This removes transport-level HoL blocking — the headline fix.
- **TLS 1.3 integrated**: encryption is part of the handshake, not a separate layer.
  - New connection: **1-RTT** to first byte (vs TCP+TLS's 2–3 RTTs).
  - Resumed connection: **0-RTT** — data rides along with the first packet.
- **Connection migration**: a QUIC connection is identified by a **connection ID**, not the
  (IP, port) 4-tuple. Switch from Wi-Fi to cellular and the connection survives — no re-handshake,
  no dropped uploads.
- Always encrypted (no plaintext QUIC), better loss recovery & congestion-control evolution
  (it lives in userspace, updateable without OS kernels).

**HTTP/3 = HTTP semantics mapped onto QUIC streams**, with **QPACK** header compression (HPACK
redesigned so header blocks don't reintroduce cross-stream blocking).

## What stays the same

HTTP semantics are untouched: methods, status codes, headers, cookies, caching — all identical.
`fetch()` doesn't change. Your app benefits without code changes; the *server/CDN* decides.

## Discovery & deployment

- Browsers learn a server speaks h3 via the **`Alt-Svc`** response header (`alt-svc: h3=":443"`)
  or DNS **HTTPS records**; the first visit may use h2, later ones upgrade.
- Requires UDP 443 open (some corporate networks block it → automatic fallback to h2).
- Major CDNs (Cloudflare, Fastly, CloudFront, Google) ship it as a checkbox.

## What it means for front-end engineers

- **Latency-bound waterfalls shrink**: faster handshakes (1/0-RTT) cut the per-origin connection
  tax that preconnect tries to hide (Level 1).
- **Lossy/mobile networks**: smoother streaming and parallel asset loading (no HoL collapse).
- **Domain sharding stays dead**: like h2, one connection multiplexes everything; sharding only
  adds handshakes.
- Check it in DevTools → Network → **Protocol column** (`h3`); measure, don't assume — h3 helps
  most at high RTT/loss, marginal on pristine LANs.

## Senior checklist

- h2 fixed HTTP-level HoL but inherited TCP-level HoL; QUIC fixes it with independent streams over UDP.
- QUIC = TLS 1.3 built-in (1-RTT/0-RTT) + connection migration via connection IDs.
- HTTP semantics unchanged — adoption is infra-level (`Alt-Svc`), not app code.
- Biggest wins on high-latency/lossy networks; verify via the DevTools Protocol column.

## References

- [web.dev: HTTP/3 — performance improvements](https://developer.chrome.com/docs/web-platform/http3)
- [RFC 9114: HTTP/3](https://datatracker.ietf.org/doc/html/rfc9114)
- [RFC 9000: QUIC](https://datatracker.ietf.org/doc/html/rfc9000)
- [Cloudflare: HTTP/3 explained](https://blog.cloudflare.com/http3-the-past-present-and-future/)
- [smashing: HTTP/3 performance deep dive](https://www.smashingmagazine.com/2021/09/http3-performance-improvements-part2/)
