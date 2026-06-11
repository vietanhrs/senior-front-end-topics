import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A <live-clock> custom element with several lifecycle bugs:
class LiveClock extends HTMLElement {
  constructor() {
    super();
    // (1) reads an attribute + writes children in the constructor
    this.format = this.getAttribute('format');
    this.innerHTML = '<span></span>';
    // (2) starts a timer in the constructor
    this.timer = setInterval(() => this.tick(), 1000);
  }
  tick() { this.querySelector('span').textContent = formatNow(this.format); }
  // (3) no disconnectedCallback → timer leaks after removal; moving the node
  //     starts a SECOND interval
  // (4) format changes at runtime aren't observed
}
customElements.define('live-clock', LiveClock);`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the custom element lifecycle"
        description="Move work out of the constructor, start/stop the timer in connected/disconnected (idempotent under moves), observe the format attribute, and guard re-definition."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Constructor = light init only (no attributes/children/timers). Start the interval in{' '}
        <code>connectedCallback</code> and clear it in <code>disconnectedCallback</code> so moving
        the node doesn't stack timers. Add <code>format</code> to <code>observedAttributes</code>.
      </Callout>

      <SolutionReveal
        language="js"
        code={`class LiveClock extends HTMLElement {
  static get observedAttributes() { return ['format']; }   // (4) observe runtime changes

  constructor() {
    super();
    // (1) constructor stays light: no attribute reads, no DOM, no timers.
    this._span = document.createElement('span');
    this._timer = null;
  }

  connectedCallback() {
    // safe to read attributes/append children HERE
    if (!this._span.isConnected) this.appendChild(this._span);
    this.tick();
    // (2)(3) start the timer on connect, idempotently
    this._timer ??= setInterval(() => this.tick(), 1000);
  }

  disconnectedCallback() {
    // (3) symmetric cleanup → no leak; a later re-connect restarts cleanly
    clearInterval(this._timer);
    this._timer = null;
  }

  attributeChangedCallback(name, _old, val) {
    if (name === 'format') this.tick();          // (4) react to format changes
  }

  get format() { return this.getAttribute('format') ?? 'HH:mm:ss'; }
  tick() { this._span.textContent = formatNow(this.format); }
}

if (!customElements.get('live-clock')) {          // guard re-definition (throws otherwise)
  customElements.define('live-clock', LiveClock);
}

// Why: connect/disconnect are symmetric and idempotent, so moving the element
// (disconnected → connected) stops then restarts exactly one timer instead of
// leaking a second. Reading attributes/children waits until connectedCallback,
// which is the only point they're guaranteed to exist for parser-created nodes.`}
      />
    </Stack>
  );
}
