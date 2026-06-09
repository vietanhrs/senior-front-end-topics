import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Two bugs related to reconciliation identity:
function ProfilePage({ userId, wide }) {
  // (1) Component defined INSIDE render -> new type every render -> remounts,
  //     so the form state is wiped on every parent re-render.
  const EditForm = () => {
    const [draft, setDraft] = useState('');
    return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
  };

  // (2) The same <Avatar> lives in two different parents -> remounts (and
  //     reloads the image) whenever \`wide\` flips.
  return wide
    ? <div className="wide"><Avatar id={userId} /><EditForm /></div>
    : <section className="narrow"><Avatar id={userId} /><EditForm /></section>;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stop the accidental remounts"
        description="This component loses form state and reloads the avatar far too often. Fix both reconciliation-identity bugs. Bonus: how would you intentionally reset the form when userId changes?"
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        (1) Move component definitions to module scope so their type identity is stable. (2) Keep
        a single tree structure and vary only props/className, so the position doesn't change.
      </Callout>

      <SolutionReveal
        code={`// Stable type identity — defined once at module scope.
function EditForm({ resetKey }: { resetKey: string }) {
  const [draft, setDraft] = useState('');
  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

function ProfilePage({ userId, wide }) {
  // Single structure; only the className changes -> Avatar + EditForm keep state.
  return (
    <div className={wide ? 'wide' : 'narrow'}>
      <Avatar id={userId} />
      {/* Intentional reset: changing key remounts the form when the user changes */}
      <EditForm key={userId} resetKey={userId} />
    </div>
  );
}`}
      />
    </Stack>
  );
}
