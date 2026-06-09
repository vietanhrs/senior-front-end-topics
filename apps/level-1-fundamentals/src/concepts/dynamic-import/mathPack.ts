/**
 * A separate module that only ever enters the app via `import('./mathPack')`,
 * so Vite emits it as its own chunk. The artificial array below makes the
 * chunk a little bigger so it's easy to spot in the Network tab.
 */
const PRIMES_SEED = Array.from({ length: 2000 }, (_, i) => i * 7 + 3);

export function nthFibonacci(n: number): number {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

export function seedSample(): number {
  return PRIMES_SEED[Math.floor(Math.random() * PRIMES_SEED.length)];
}
