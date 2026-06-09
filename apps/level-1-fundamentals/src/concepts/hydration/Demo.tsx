import { useMemo, useState } from 'react';
import { Badge, Button, Group, Stack, Switch, Text } from '@mantine/core';
import { IconBolt, IconRefresh } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '../../workbook/ui';

/**
 * We can't run a real SSR server inside this SPA, so we *simulate* the
 * lifecycle: first we show static "server HTML" (no event handlers — clicking
 * does nothing), then "hydration" swaps in a live React subtree that attaches
 * handlers onto the same visual UI.
 */
export function Demo() {
  const { logs, log, clear } = useLogger();
  const [hydrated, setHydrated] = useState(false);
  const [count, setCount] = useState(0);
  const [mismatch, setMismatch] = useState(false);

  // A value baked into the "server HTML". With mismatch mode on, this is a
  // non-deterministic value the client would NOT reproduce.
  const serverValue = useMemo(() => (mismatch ? Math.floor(Math.random() * 1000) : 42), [mismatch]);

  const serverHtml = `
    <div style="font-family:inherit">
      <p style="margin:0 0 8px">Render từ server — token: <b>#${serverValue}</b></p>
      <button style="padding:6px 12px;border-radius:8px;border:1px solid #ccc;background:#f1f3f5">
        Count: 0 (chưa tương tác được)
      </button>
    </div>`;

  function hydrate() {
    log('Browser hiển thị HTML tĩnh từ server (FCP) ✔', 'success');
    log('Tải & parse client JS bundle…', 'sync');
    // Simulated client-side value at hydration time.
    const clientValue = mismatch ? Math.floor(Math.random() * 1000) : 42;
    log(`React dựng lại Virtual DOM, so khớp với DOM có sẵn (token client #${clientValue})`, 'sync');
    if (mismatch && clientValue !== serverValue) {
      log(
        `⚠ Hydration mismatch: server="#${serverValue}" ≠ client="#${clientValue}". React phải sửa DOM.`,
        'error',
      );
    }
    log('Gắn event listeners → UI tương tác được (TTI) ✔', 'success');
    setHydrated(true);
  }

  function reset() {
    setHydrated(false);
    setCount(0);
    clear();
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Cách đọc demo">
        Trước khi hydrate, nút bên dưới là HTML tĩnh — bấm <b>không</b> ăn. Sau khi hydrate,
        đúng UI đó trở nên tương tác. Bật "Chế độ mismatch" để thấy lỗi khi giá trị render
        không tất định giữa hai phía.
      </Callout>

      <DemoCard
        title="Vòng đời SSR → Hydration"
        right={
          <Badge color={hydrated ? 'teal' : 'orange'} variant="filled">
            {hydrated ? 'Hydrated (interactive)' : 'Static HTML (chết)'}
          </Badge>
        }
      >
        <Stack gap="md">
          <Switch
            label="Chế độ mismatch (token render bằng giá trị ngẫu nhiên)"
            checked={mismatch}
            onChange={(e) => setMismatch(e.currentTarget.checked)}
            disabled={hydrated}
          />

          <div className="rounded-lg border border-dashed p-4">
            {hydrated ? (
              <Stack gap={8}>
                <Text>
                  Render từ client — token: <b>#{serverValue}</b>
                </Text>
                <Button
                  variant="filled"
                  leftSection={<IconBolt size={16} />}
                  onClick={() => setCount((c) => c + 1)}
                  w="fit-content"
                >
                  Count: {count} (đã tương tác được)
                </Button>
              </Stack>
            ) : (
              // The "server HTML" — note: dangerouslySetInnerHTML has NO handlers.
              <div dangerouslySetInnerHTML={{ __html: serverHtml }} />
            )}
          </div>

          <Group>
            <Button
              color="grape"
              leftSection={<IconBolt size={16} />}
              onClick={hydrate}
              disabled={hydrated}
            >
              Hydrate
            </Button>
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={reset}>
              Reset
            </Button>
          </Group>

          <LogConsole logs={logs} height={180} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
