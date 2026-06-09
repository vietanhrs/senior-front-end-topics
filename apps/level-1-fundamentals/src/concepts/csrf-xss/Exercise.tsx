import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const buggy = `// Shows a bio (user-supplied HTML) and an avatar.
// It has an XSS hole. Find and fix it, while keeping basic formatting (bold, links).
function Profile({ user }) {
  return (
    <div>
      <h2>{user.name}</h2>
      {/* bio allows a little HTML */}
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      <img src={user.avatarUrl} alt="avatar" />
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: close the XSS hole in Profile"
        description="user.bio comes from user input and is rendered straight via dangerouslySetInnerHTML. Fix it so a little formatting is still allowed but scripts can't be injected."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        If you don't need HTML → let React escape it (<code>{'{user.bio}'}</code>). If you need
        formatting → sanitize with DOMPurify using a tag/attr allowlist. Don't forget other sinks
        (e.g. an <code>avatarUrl</code> with a <code>javascript:</code> scheme).
      </Callout>

      <SolutionReveal
        code={`import DOMPurify from 'dompurify';

function Profile({ user }) {
  // Allow only a few formatting tags, no scripts/handlers.
  const safeBio = DOMPurify.sanitize(user.bio, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });

  // Block dangerous URL schemes (javascript:, data:) for the avatar.
  const safeAvatar = /^https?:\\/\\//.test(user.avatarUrl) ? user.avatarUrl : '/default.png';

  return (
    <div>
      <h2>{user.name}</h2>{/* React auto-escapes name */}
      <div dangerouslySetInnerHTML={{ __html: safeBio }} />
      <img src={safeAvatar} alt="avatar" />
    </div>
  );
}

// Defense in depth: add CSP + Trusted Types at the app level (Level 6),
// and set the session cookie HttpOnly so XSS can't read the session.`}
      />
    </Stack>
  );
}
