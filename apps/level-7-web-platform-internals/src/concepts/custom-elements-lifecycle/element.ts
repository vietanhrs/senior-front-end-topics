// A tiny pub/sub so the custom element can report lifecycle events to the demo
// (disconnectedCallback fires after removal, so DOM-event bubbling is unreliable).
type Listener = (msg: string, tone?: 'sync' | 'success' | 'macro' | 'micro' | 'error') => void;
const listeners = new Set<Listener>();
export const lifecycleBus = {
  emit(msg: string, tone?: Parameters<Listener>[1]) {
    listeners.forEach((l) => l(msg, tone));
  },
  on(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const TAG = 'sfe-lifecycle-el';

/** Defines the element exactly once (customElements.define throws on re-define). */
export function ensureDefined() {
  if (customElements.get(TAG)) return;

  class LifecycleElement extends HTMLElement {
    // Only attributes listed here trigger attributeChangedCallback.
    static get observedAttributes() {
      return ['label'];
    }
    constructor() {
      super();
      lifecycleBus.emit('constructor() — element created (not yet in the DOM)', 'sync');
    }
    connectedCallback() {
      lifecycleBus.emit('connectedCallback() — inserted into the DOM (do setup/render here)', 'success');
      this.render();
    }
    disconnectedCallback() {
      lifecycleBus.emit('disconnectedCallback() — removed from the DOM (cleanup here)', 'error');
    }
    adoptedCallback() {
      lifecycleBus.emit('adoptedCallback() — moved to a new document', 'macro');
    }
    attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
      lifecycleBus.emit(`attributeChangedCallback("${name}", ${JSON.stringify(oldV)} → ${JSON.stringify(newV)})`, 'micro');
      this.render();
    }
    private render() {
      this.textContent = `🧩 <${TAG}> label="${this.getAttribute('label') ?? ''}"`;
      this.setAttribute('style', 'display:inline-block;padding:6px 10px;border:1px solid var(--mantine-color-indigo-4);border-radius:8px;font-family:monospace;font-size:12px');
    }
  }

  customElements.define(TAG, LifecycleElement);
  lifecycleBus.emit(`customElements.define("${TAG}") — any matching elements already in the DOM are now UPGRADED`, 'sync');
}
