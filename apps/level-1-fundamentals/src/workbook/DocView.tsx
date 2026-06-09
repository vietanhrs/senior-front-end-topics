import { Anchor, Table, TypographyStylesProvider } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  // Render fenced code blocks with Mantine's CodeHighlight. We unwrap <pre>
  // so CodeHighlight (a block element) isn't nested illegally inside <pre>.
  pre: ({ children }) => <>{children}</>,
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const text = String(children).replace(/\n$/, '');
    if (match) {
      return (
        <CodeHighlight
          code={text}
          language={match[1]}
          my="md"
          radius="md"
          withCopyButton
        />
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  a: ({ href, children }) => (
    <Anchor href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </Anchor>
  ),
  table: ({ children }) => (
    <Table withTableBorder withColumnBorders striped my="md">
      {children}
    </Table>
  ),
};

export function DocView({ markdown }: { markdown: string }) {
  return (
    <TypographyStylesProvider>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </TypographyStylesProvider>
  );
}
