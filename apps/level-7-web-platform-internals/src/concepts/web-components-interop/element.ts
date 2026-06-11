// A small real custom element used to demonstrate React interop:
//  - `value`/`max` as properties (rich data path),
//  - reflects to render,
//  - dispatches a `rate-change` CustomEvent on click.
export const TAG = 'sfe-stars';

export function ensureDefined() {
  if (customElements.get(TAG)) return;

  class Stars extends HTMLElement {
    private _value = 0;
    private _max = 5;

    static get observedAttributes() {
      return ['value', 'max'];
    }
    connectedCallback() {
      this.style.cssText = 'display:inline-flex;gap:4px;cursor:pointer;font-size:22px;user-select:none';
      this.render();
    }
    attributeChangedCallback(name: string, _o: string | null, v: string | null) {
      if (name === 'value') this._value = Number(v) || 0;
      if (name === 'max') this._max = Number(v) || 5;
      this.render();
    }
    // Property setters — this is the rich-data path frameworks should use.
    set value(v: number) {
      this._value = v;
      this.render();
    }
    get value() {
      return this._value;
    }
    set max(v: number) {
      this._max = v;
      this.render();
    }
    get max() {
      return this._max;
    }
    private render() {
      if (!this.isConnected) return;
      this.innerHTML = '';
      for (let i = 1; i <= this._max; i++) {
        const star = document.createElement('span');
        star.textContent = i <= this._value ? '★' : '☆';
        star.style.color = i <= this._value ? '#f59f00' : '#adb5bd';
        star.addEventListener('click', () => {
          this._value = i;
          this.render();
          // native CustomEvent — NOT a React synthetic event
          this.dispatchEvent(new CustomEvent('rate-change', { detail: { value: i }, bubbles: true }));
        });
        this.appendChild(star);
      }
    }
  }
  customElements.define(TAG, Stars);
}
