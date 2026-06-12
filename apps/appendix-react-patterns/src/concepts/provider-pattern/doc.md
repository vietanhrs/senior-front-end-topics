# Provider Pattern

## The pattern

The **Provider pattern** uses React **Context** to make a value available to a whole subtree, so
deeply-nested components can read it **without prop drilling** (threading a prop through every
intermediate layer that doesn't care about it). It's the idiomatic way to share *global-ish* state:
theme, current user/auth, locale, a feature-flag set, a design-system config.

```jsx
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  // memoize the value so consumers don't re-render when ThemeProvider re-renders for other reasons
  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// pair every context with a typed hook that ASSERTS it's inside the provider
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
```

A leaf component anywhere below just calls `useTheme()` — no props passed through the middle.

## The two senior gotchas

### 1. Re-render scope
**Every consumer re-renders when the context value's identity changes.** Two traps:
- **Don't pass a fresh object literal** as `value` (`value={{ theme, toggle }}`) — it's a new
  reference every render, re-rendering all consumers. **Memoize** it (`useMemo`).
- **Split contexts** by change frequency. A value that mixes rarely-changing config with a
  fast-changing field forces everyone to re-render on the fast field. Put them in separate providers
  (or split "state" and "dispatch" contexts) so consumers subscribe to only what they use.

### 2. Context is not a state manager
Context is a **dependency-injection / transport** mechanism, not a store with selectors. It has no
built-in "subscribe to a slice" — any value change re-renders all consumers. For large, frequently-
updated global state with fine-grained subscriptions, use a real store (Zustand/Redux/Jotai), often
*exposed through* a provider + hook. Use Context for low-frequency, widely-read values.

## Conventions

- **Co-locate** the context, provider, and `useX()` hook in one module; export the provider and the
  hook, **not the raw context** (so consumers can't bypass the guard).
- **Assert** in the hook so misuse fails loudly with a helpful message.
- Provide a sensible **default** only if "no provider" is a valid state; otherwise throw.

## Senior checklist

- Provider + Context + a typed `useX()` hook = share values across a subtree **without prop
  drilling**.
- **Memoize the `value`** and **split contexts by update frequency** — every consumer re-renders on
  value-identity change.
- Context is **DI/transport**, not a selector store; reach for a real store (behind a provider) for
  large, hot, finely-subscribed state.
- Export the provider + hook (not the raw context); make the hook assert it's used inside the
  provider.

## References

- [React: useContext / Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [patterns.dev: Provider Pattern](https://www.patterns.dev/react/provider-pattern/)
- [React: createContext](https://react.dev/reference/react/createContext)
