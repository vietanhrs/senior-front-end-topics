import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// 'user' is threaded through every layer just so a deep button can read it
// (prop drilling). And the one Context that exists re-renders all consumers on
// every keystroke because it bundles everything + uses an inline value object.
function App() {
  const [user, setUser] = useState(null);
  return <Page user={user} setUser={setUser} />;
}
function Page({ user, setUser }) { return <Layout user={user} setUser={setUser} />; }
function Layout({ user, setUser }) { return <Header user={user} setUser={setUser} />; }
function Header({ user, setUser }) { return <Avatar user={user} onLogout={() => setUser(null)} />; }
function Avatar({ user, onLogout }) { return user ? <button onClick={onLogout}>{user.name}</button> : null; }

// elsewhere, a too-broad context:
<AppContext.Provider value={{ user, setUser, theme, setTheme, query, setQuery }}>
  {/* typing in a search box (query) re-renders every theme/user consumer */}
</AppContext.Provider>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: replace prop drilling with a provider — done right"
        description="Stop threading user through every layer; expose it via a provider + hook. And fix the over-broad context that re-renders everyone on every keystroke (inline value object + bundling fast and slow state together)."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Make an <code>AuthProvider</code> with a <b>memoized</b> value and a <code>useAuth()</code>{' '}
        hook; the deep <code>Avatar</code> reads it directly. <b>Split</b> the mega-context by update
        frequency so the fast-changing <code>query</code> doesn't re-render <code>theme</code>/
        <code>user</code> consumers.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// --- auth context, co-located with its hook ---
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, login: setUser, logout: () => setUser(null) }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// no more drilling — intermediate layers pass NOTHING
function App() { return <AuthProvider><Page /></AuthProvider>; }
function Page() { return <Layout />; }
function Layout() { return <Header />; }
function Header() { return <Avatar />; }
function Avatar() {
  const { user, logout } = useAuth();          // read directly, any depth
  return user ? <button onClick={logout}>{user.name}</button> : null;
}

// --- split the mega-context by update frequency ---
// Fast-changing 'query' gets its OWN provider so it can't re-render theme/auth consumers.
<AuthProvider>
  <ThemeProvider>
    <SearchProvider>   {/* query lives here, isolated */}
      <Routes />
    </SearchProvider>
  </ThemeProvider>
</AuthProvider>
// (further: split a store into separate state + dispatch contexts so components that
//  only dispatch never re-render on state changes.)

// Why it's better: no prop drilling (deep components read context directly); the
// memoized value means consumers re-render only on real changes; and splitting
// contexts by how often they change stops a keystroke in search from re-rendering
// every theme/user consumer in the app.`}
      />
    </Stack>
  );
}
