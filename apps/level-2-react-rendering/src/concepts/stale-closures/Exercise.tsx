import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A chat widget that auto-scrolls and reports the unread count to a parent
// every few seconds. Two stale-closure bugs:
function Chat({ roomId, onReport }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);

  // (1) Registered once; the handler captures \`messages\` = [] forever.
  useEffect(() => {
    socket.on('message', (m) => {
      setMessages(messages.concat(m));   // always concat onto the initial []
      setUnread(unread + 1);             // always 0 + 1
    });
    return () => socket.off('message');
  }, []);

  // (2) Reports the unread count, but \`unread\` is frozen from the first render.
  useEffect(() => {
    const id = setInterval(() => onReport(unread), 3000);
    return () => clearInterval(id);
  }, []);

  return <MessageList items={messages} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the stale closures"
        description="The socket handler and the interval both capture first-render values. Fix them so messages accumulate correctly and the latest unread count is reported — without needlessly re-subscribing the socket on every message."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        For state derived from previous state, use functional updaters. To read the freshest value
        inside a long-lived callback (socket/interval) without re-subscribing, mirror it into a
        ref that you keep current each render.
      </Callout>

      <SolutionReveal
        code={`function Chat({ roomId, onReport }) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);

  // (1) Functional updaters -> always operate on the latest state.
  useEffect(() => {
    const handler = (m) => {
      setMessages((prev) => [...prev, m]);   // latest list
      setUnread((n) => n + 1);               // latest count
    };
    socket.on('message', handler);
    return () => socket.off('message', handler);
  }, []); // safe: handler no longer closes over messages/unread

  // (2) Mirror the latest values into refs; the interval reads them fresh.
  const unreadRef = useRef(unread);
  const onReportRef = useRef(onReport);
  useEffect(() => { unreadRef.current = unread; }, [unread]);
  useEffect(() => { onReportRef.current = onReport; }, [onReport]);

  useEffect(() => {
    const id = setInterval(() => onReportRef.current(unreadRef.current), 3000);
    return () => clearInterval(id);
  }, []);

  return <MessageList items={messages} />;
}`}
      />
    </Stack>
  );
}
