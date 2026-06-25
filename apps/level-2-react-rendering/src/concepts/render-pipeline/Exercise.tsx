import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const prompt = `// Classify each line as render phase, mutation commit, layout commit, or
// passive commit. Then move the side effects to the correct phase.
function ProductCard({ product }) {
  analytics.track('rendered_product', product.id);      // A
  const buttonRef = useRef(null);
  const [width, setWidth] = useState(0);

  const label = expensiveFormat(product.price);         // B

  useLayoutEffect(() => {
    setWidth(buttonRef.current.getBoundingClientRect().width); // C
  }, [product.id]);

  useEffect(() => {
    document.title = product.name;                      // D
  }, [product.name]);

  return <button ref={buttonRef}>{label} / {width}</button>; // E
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: place work in the right phase"
        description="React can restart render, but commit is where the host tree is real. Classify the lines and fix the render-phase side effect."
      >
        <CodeHighlight code={prompt} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Pure calculation for JSX belongs in render. Anything observable outside React belongs in
        an event handler or effect. Layout measurement belongs in layout commit because the DOM
        exists there.
      </Callout>

      <SolutionReveal
        code={`// A: render-phase side effect -> move to passive effect or event instrumentation.
// B: render-phase pure calculation -> allowed, but memoize if expensive.
// C: layout commit -> allowed to read layout synchronously.
// D: passive commit -> synchronizes an external system after paint.
// E: render output -> returns React elements only, not DOM nodes.

function ProductCard({ product }) {
  const buttonRef = useRef(null);
  const [width, setWidth] = useState(0);

  const label = useMemo(
    () => expensiveFormat(product.price),
    [product.price],
  );

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    setWidth(button.getBoundingClientRect().width);
  }, [product.id, label]);

  useEffect(() => {
    analytics.track('committed_product', product.id);
  }, [product.id]);

  useEffect(() => {
    document.title = product.name;
  }, [product.name]);

  return <button ref={buttonRef}>{label} / {width}</button>;
}`}
      />
    </Stack>
  );
}
