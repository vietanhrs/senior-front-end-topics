import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// An audio pipeline sends PCM frames to a worker for processing, then needs the
// processed frames back to play them. It's slow (copies) AND has a detachment
// bug. Optimize with transfers and fix the bug.

// main.ts
function process(frame /* Float32Array */) {
  worker.postMessage({ samples: frame });       // ❌ structured clone copies every frame
  drawWaveform(frame);                            // (still need it on main — fine here since copied)
}

// worker.ts
self.onmessage = ({ data }) => {
  const out = applyGain(data.samples);            // Float32Array result
  self.postMessage({ out });                      // ❌ copies the result back too
};

// later, someone "optimizes" the main thread send like this:
worker.postMessage({ samples: frame }, [frame]); // ❌ TypeError: Float32Array is not transferable
// and after fixing that, drawWaveform(frame) renders silence. Why?`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: zero-copy the audio pipeline correctly"
        description="Transfer instead of clone in both directions, fix the 'not transferable' error, and resolve why drawWaveform renders silence after transferring. Decide what to do when main ALSO needs the data."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        TypedArrays aren't transferable — transfer their <code>.buffer</code> and rebuild the view.
        After transfer the sender's buffer is detached, so if main still needs it you must either
        keep a copy or have the worker <b>transfer the result back</b>. Watch view↔buffer offsets.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// main.ts
function process(frame /* Float32Array */) {
  // If main needs the waveform too, draw FIRST (before detaching), or send a copy.
  drawWaveform(frame);

  // Transfer the BUFFER (not the view). Reconstruct on the other side.
  worker.postMessage(
    { buffer: frame.buffer, length: frame.length },
    [frame.buffer],                              // ✅ ArrayBuffer is transferable
  );
  // frame is now detached on main — that's why drawWaveform AFTER this rendered
  // silence (byteLength 0). Either draw before transferring (above) or keep a copy.
}

// worker.ts
self.onmessage = ({ data }) => {
  const samples = new Float32Array(data.buffer, 0, data.length); // rebuild the view
  const out = applyGain(samples);                                 // Float32Array
  // Transfer the RESULT back so main regains owned memory with zero copy:
  self.postMessage({ buffer: out.buffer, length: out.length }, [out.buffer]);
};

// main: receive the processed buffer
worker.onmessage = ({ data }) => {
  const processed = new Float32Array(data.buffer, 0, data.length);
  play(processed);
};

// Summary of the fixes:
//  1) Transfer .buffer, not the Float32Array (views aren't transferable).
//  2) "silence" = the sender's buffer was detached by the transfer; draw/copy
//     BEFORE transferring if main still needs it.
//  3) Transfer the result back too → both directions are zero-copy.
//  4) If both threads must read/write the SAME frames concurrently, that's a
//     SharedArrayBuffer use case instead (prev concept) — but here handoff is right.`}
      />
    </Stack>
  );
}
