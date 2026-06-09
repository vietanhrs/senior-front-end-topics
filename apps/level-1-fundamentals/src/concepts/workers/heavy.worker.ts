/// <reference lib="webworker" />

// A dedicated worker. Casting `self` gives us the correct worker-scope types
// without conflicting with the DOM `Window` typings used elsewhere.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

/** Deliberately CPU-heavy: count primes below `limit` with trial division. */
function countPrimes(limit: number): number {
  let count = 0;
  for (let n = 2; n < limit; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        prime = false;
        break;
      }
    }
    if (prime) count++;
  }
  return count;
}

ctx.onmessage = (e: MessageEvent<{ limit: number }>) => {
  const t0 = performance.now();
  const result = countPrimes(e.data.limit);
  ctx.postMessage({ result, ms: Math.round(performance.now() - t0) });
};
