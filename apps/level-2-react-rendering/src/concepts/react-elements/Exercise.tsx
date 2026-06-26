import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Mini renderer exercise. It receives React-like element objects and must
// produce DOM nodes. This implementation confuses element data with DOM work.
function renderElement(element) {
  const node = document.createElement(element.type);

  // BUG 1: key/ref are not normal props and should not become attributes.
  for (const [name, value] of Object.entries(element.props)) {
    node.setAttribute(name, value);
  }

  // BUG 2: children can be text, arrays, or nested elements.
  node.appendChild(renderElement(element.props.children));

  // BUG 3: function component elements have type === function, not a tag name.
  return node;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the element-to-DOM mental model"
        description="Repair the mini renderer so it handles primitives, host elements, function components, children arrays, and special fields correctly."
      >
        <CodeHighlight code={buggy} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        A React element is only a description. For a function component, call the function to get
        more elements. For a host element, create the DOM node and apply props except
        <code>children</code>, <code>key</code>, and <code>ref</code>.
      </Callout>

      <SolutionReveal
        code={`function renderElement(element) {
  if (element == null || element === false) return document.createTextNode('');

  if (typeof element === 'string' || typeof element === 'number') {
    return document.createTextNode(String(element));
  }

  if (Array.isArray(element)) {
    const fragment = document.createDocumentFragment();
    element.forEach((child) => fragment.appendChild(renderElement(child)));
    return fragment;
  }

  // Function component: compute its rendered element tree first.
  if (typeof element.type === 'function') {
    return renderElement(element.type(element.props));
  }

  // Host component: now create real DOM.
  const node = document.createElement(element.type);

  for (const [name, value] of Object.entries(element.props ?? {})) {
    if (name === 'children' || name === 'key' || name === 'ref') continue;
    if (name === 'className') node.setAttribute('class', value);
    else if (name.startsWith('on') && typeof value === 'function') {
      node.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value != null && value !== false) {
      node.setAttribute(name, String(value));
    }
  }

  const children = element.props?.children;
  if (children != null) node.appendChild(renderElement(children));
  return node;
}`}
      />
    </Stack>
  );
}
