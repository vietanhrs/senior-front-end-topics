import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A <fancy-card> web component. Several encapsulation/theming bugs:
class FancyCard extends HTMLElement {
  connectedCallback() {
    // (1) writing to light DOM, not a shadow root → no encapsulation at all
    this.innerHTML = '<div class="card"><h2>' + this.getAttribute('title') + '</h2></div>';
    // (2) relies on a GLOBAL stylesheet (.card{...}) that won't scope to this component
    // (3) no way for the host page to theme it (no parts, no custom props)
    // (4) wants to show consumer-provided content but has no slot
  }
}
customElements.define('fancy-card', FancyCard);

// usage the author WANTED to support but can't:
//   <fancy-card title="Hi"> <p>my content</p> </fancy-card>
//   host page: fancy-card::part(title) { color: rebeccapurple }`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: give the component real encapsulation + theming"
        description="Use a shadow root with scoped styles, project consumer content via a slot, expose a themeable part and a custom property, and avoid XSS from the title attribute."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>attachShadow</code> + a scoped <code>&lt;style&gt;</code>; render a <code>&lt;slot&gt;</code>
        for children; mark the title node <code>part="title"</code>; read a{' '}
        <code>--card-accent</code> custom property; set <code>textContent</code> (not{' '}
        <code>innerHTML</code>) for the attribute value.
      </Callout>

      <SolutionReveal
        language="js"
        code={`class FancyCard extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;                 // guard double-attach
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = \`
      <style>
        :host { display: block; }                                  /* style the host */
        .card { border: 1px solid var(--card-accent, #ccc); border-radius: 8px; padding: 12px; }
        h2 { margin: 0 0 8px; color: var(--card-accent, inherit); } /* themeable via custom prop */
      </style>
      <div class="card">
        <h2 part="title"></h2>      <!-- (3) exposed for ::part theming -->
        <slot></slot>               <!-- (4) consumer content is projected here -->
      </div>\`;
    // (1)(2) encapsulated: scoped styles live in the shadow, not a global sheet.
    // (5) set textContent, NOT innerHTML → the title attribute can't inject markup.
    root.querySelector('h2').textContent = this.getAttribute('title') ?? '';
  }

  static get observedAttributes() { return ['title']; }
  attributeChangedCallback(name, _old, val) {
    if (name === 'title' && this.shadowRoot) {
      this.shadowRoot.querySelector('h2').textContent = val ?? '';
    }
  }
}
customElements.define('fancy-card', FancyCard);

/* Now the intended usage works:
   <fancy-card title="Hi"><p>my content</p></fancy-card>   // <p> is slotted in
   host page CSS:
     fancy-card { --card-accent: rebeccapurple; }          // custom prop crosses the boundary
     fancy-card::part(title) { letter-spacing: .02em; }    // ::part theming
   The page's global "h2 { color: red }" can't reach the shadow's h2 — encapsulated. */`}
      />
    </Stack>
  );
}
