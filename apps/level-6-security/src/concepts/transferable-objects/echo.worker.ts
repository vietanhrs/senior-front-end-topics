/// <reference lib="webworker" />

// Receives a buffer, reads a byte (proving it owns real memory), and replies.
// For the "transfer back" case it returns the buffer via a transfer list.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; transferBack: boolean }>) => {
  const { buffer, transferBack } = e.data;
  const view = new Uint8Array(buffer);
  // Touch the data so the engine can't optimize the copy away.
  let checksum = 0;
  for (let i = 0; i < view.length; i += 4096) checksum = (checksum + view[i]) & 0xff;

  if (transferBack) {
    ctx.postMessage({ byteLength: buffer.byteLength, checksum, buffer }, [buffer]);
  } else {
    ctx.postMessage({ byteLength: buffer.byteLength, checksum });
  }
};
