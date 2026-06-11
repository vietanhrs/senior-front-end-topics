import { useEffect, useState } from 'react';
import { Badge, Button, Group, NumberInput, Stack } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

// A real, hand-assembled WASM module: (func (export "add") (param i32 i32) (result i32)
//   local.get 0  local.get 1  i32.add)
const WASM_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // magic + version
  0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f, // type: (i32,i32)->i32
  0x03, 0x02, 0x01, 0x00, // func: 1 func of type 0
  0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00, // export "add" -> func 0
  0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b, // code: get0 get1 add end
]);

const supported = typeof WebAssembly !== 'undefined';
const jsAdd = (a: number, b: number) => (a + b) | 0;

export function Demo() {
  const { logs, log } = useLogger();
  const [wasmAdd, setWasmAdd] = useState<((a: number, b: number) => number) | null>(null);
  const [a, setA] = useState(40);
  const [b, setB] = useState(2);
  const [bench, setBench] = useState<{ js: number; wasm: number } | null>(null);

  useEffect(() => {
    if (!supported) return;
    let active = true;
    WebAssembly.instantiate(WASM_BYTES).then(({ instance, module }) => {
      if (!active) return;
      const fn = instance.exports.add as (a: number, b: number) => number;
      setWasmAdd(() => fn);
      const exports = WebAssembly.Module.exports(module).map((e) => `${e.name}:${e.kind}`).join(', ');
      log(`instantiated real WASM module (${WASM_BYTES.length} bytes) — exports: ${exports}`, 'success');
    }).catch((e) => log(`instantiate failed: ${(e as Error).message}`, 'error'));
    return () => { active = false; };
  }, [log]);

  const result = wasmAdd ? wasmAdd(a, b) : null;

  const runBench = () => {
    if (!wasmAdd) return;
    const N = 5_000_000;
    let s1 = 0;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) s1 = jsAdd(s1, i);
    const tJs = performance.now() - t0;

    let s2 = 0;
    const t1 = performance.now();
    for (let i = 0; i < N; i++) s2 = wasmAdd(s2, i); // crosses JS↔WASM boundary each call
    const tWasm = performance.now() - t1;

    setBench({ js: tJs, wasm: tWasm });
    log(`${N.toLocaleString()} calls — JS: ${tJs.toFixed(0)}ms, WASM: ${tWasm.toFixed(0)}ms (s=${s1 === s2 ? 'match' : 'MISMATCH'})`, 'macro');
    log('WASM is similar/slower here: the boundary crossing dwarfs an i32 add. Batch heavy work INSIDE WASM instead.', 'sync');
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="A real WebAssembly module, instantiated and called">
        The bytes below are an actual compiled WASM module exporting <code>add(i32, i32)</code>. It's
        instantiated with <code>WebAssembly.instantiate</code> and called live. The benchmark then
        calls it 5M times to show the senior lesson: crossing the JS↔WASM boundary per call is so
        cheap-but-not-free that WASM is <i>not</i> faster for trivial ops — the win is heavy compute
        kept <b>inside</b> WASM.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="WebAssembly unavailable">
          This engine has no <code>WebAssembly</code>. The integration model in the theory still applies.
        </Callout>
      )}

      <DemoCard title="Call the WASM export">
        <Group align="flex-end">
          <NumberInput label="a" value={a} onChange={(v) => setA(Number(v) || 0)} w={120} />
          <NumberInput label="b" value={b} onChange={(v) => setB(Number(v) || 0)} w={120} />
          <Badge size="lg" variant="light" color={wasmAdd ? 'teal' : 'gray'}>
            wasm.add(a, b) = {result === null ? '—' : result}
          </Badge>
        </Group>
      </DemoCard>

      <Group>
        <Button onClick={runBench} disabled={!wasmAdd}>Benchmark 5M calls (JS vs WASM)</Button>
        {bench && (
          <>
            <Badge variant="light" color="blue">JS {bench.js.toFixed(0)}ms</Badge>
            <Badge variant="light" color="grape">WASM {bench.wasm.toFixed(0)}ms</Badge>
            <Badge variant="light" color={bench.wasm <= bench.js ? 'teal' : 'orange'}>
              {bench.wasm <= bench.js ? 'WASM faster' : 'WASM slower (boundary cost)'}
            </Badge>
          </>
        )}
      </Group>

      <LogConsole logs={logs} height={150} empty="Module instantiates on load; run the benchmark to see boundary cost." />
    </Stack>
  );
}
