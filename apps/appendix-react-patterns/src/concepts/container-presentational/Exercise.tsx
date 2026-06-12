import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// One component does everything: fetching, loading state, error handling, AND
// rendering. It can't be reused with other data, and you can't render it in
// Storybook or test it without mocking fetch.
function ProductPanel({ id }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products/' + id)
      .then((r) => r.json()).then(setProduct).catch(setError);
  }, [id]);

  if (error) return <div className="error">Failed: {error.message}</div>;
  if (!product) return <div className="spinner" />;
  return (
    <div className="card">
      <h3>{product.title}</h3>
      <p>{product.price}</p>
      <button onClick={() => buy(product.id)}>Buy</button>
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: split logic from view"
        description="Separate the data/logic from the rendering so the view is a pure, reusable, testable presentational component — and the fetching lives in a hook (the modern container)."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Make a pure <code>ProductCard</code> that takes <code>product</code>/<code>error</code>/
        <code>loading</code>/<code>onBuy</code> as props (no fetch). Move the fetching into a{' '}
        <code>useProduct(id)</code> hook (the modern "container"). The wiring component just calls
        the hook and renders the card.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// 1) Presentational: pure, prop-driven — reusable + testable, no fetch to mock.
function ProductCard({ product, error, loading, onBuy }) {
  if (error) return <div className="error">Failed: {error.message}</div>;
  if (loading || !product) return <div className="spinner" />;
  return (
    <div className="card">
      <h3>{product.title}</h3>
      <p>{product.price}</p>
      <button onClick={() => onBuy(product.id)}>Buy</button>
    </div>
  );
}

// 2) The logic as a custom hook (the modern container — no wrapper component).
function useProduct(id) {
  const [state, setState] = useState({ product: null, error: null, loading: true });
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    fetch('/api/products/' + id)
      .then((r) => r.json())
      .then((product) => active && setState({ product, error: null, loading: false }))
      .catch((error) => active && setState({ product: null, error, loading: false }));
    return () => { active = false; };
  }, [id]);
  return state;
}

// 3) Wiring: thin — call the hook, pass props to the dumb view.
function ProductPanel({ id }) {
  const { product, error, loading } = useProduct(id);
  return <ProductCard product={product} error={error} loading={loading} onBuy={buy} />;
}

// Why it's better: ProductCard renders any product/state from props — reuse it
// anywhere, snapshot every state in Storybook, unit-test with plain objects (no
// fetch mock). The data logic is isolated in useProduct (reusable across views),
// and the panel is a 1-line wiring layer.`}
      />
    </Stack>
  );
}
