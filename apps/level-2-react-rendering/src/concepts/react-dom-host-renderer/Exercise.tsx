import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// This host prop patcher is intentionally naive. It breaks common ReactDOM
// semantics and leaks old props.
function patchProps(node, prevProps, nextProps) {
  for (const [name, value] of Object.entries(nextProps)) {
    if (name === 'children') {
      node.textContent = value;
    } else {
      node.setAttribute(name, value);
    }
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: patch host props like a renderer"
        description="Fix the prop patcher so it handles removed props, className, style object diffs, booleans, events, text children, and dangerouslySetInnerHTML."
      >
        <CodeHighlight code={buggy} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        A host renderer needs DOM semantics. Remove old props first, keep events out of attributes,
        and never write both <code>children</code> and <code>dangerouslySetInnerHTML</code>.
      </Callout>

      <SolutionReveal
        code={`function patchProps(node, prevProps = {}, nextProps = {}) {
  for (const name of Object.keys(prevProps)) {
    if (name === 'children' || name in nextProps) continue;

    if (name === 'className') node.removeAttribute('class');
    else if (name === 'style') {
      for (const key of Object.keys(prevProps.style ?? {})) node.style[key] = '';
    } else if (name.startsWith('on')) {
      node.removeEventListener(name.slice(2).toLowerCase(), prevProps[name]);
    } else if (typeof prevProps[name] === 'boolean') {
      node[name] = false;
    } else {
      node.removeAttribute(name);
    }
  }

  for (const [name, value] of Object.entries(nextProps)) {
    if (name === 'children') {
      if (nextProps.dangerouslySetInnerHTML == null) {
        node.textContent = value == null ? '' : String(value);
      }
    } else if (name === 'dangerouslySetInnerHTML') {
      node.innerHTML = value?.__html ?? '';
    } else if (name === 'className') {
      node.className = value ?? '';
    } else if (name === 'style') {
      const prevStyle = prevProps.style ?? {};
      const nextStyle = value ?? {};
      for (const key of Object.keys(prevStyle)) {
        if (!(key in nextStyle)) node.style[key] = '';
      }
      for (const [key, styleValue] of Object.entries(nextStyle)) {
        node.style[key] = typeof styleValue === 'number' ? \`\${styleValue}px\` : styleValue;
      }
    } else if (name.startsWith('on') && typeof value === 'function') {
      const eventName = name.slice(2).toLowerCase();
      if (prevProps[name]) node.removeEventListener(eventName, prevProps[name]);
      node.addEventListener(eventName, value);
    } else if (typeof value === 'boolean') {
      node[name] = value;
      if (value) node.setAttribute(name, '');
      else node.removeAttribute(name);
    } else if (value == null || value === false) {
      node.removeAttribute(name);
    } else {
      node.setAttribute(name, String(value));
    }
  }
}`}
      />
    </Stack>
  );
}
