import { Button, Group, Stack } from '@mantine/core';
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '../../workbook/ui';

export function Demo() {
  const { logs, log, clear } = useLogger();

  function runClassic() {
    clear();
    log("console.log('script start')", 'sync');

    setTimeout(() => log('setTimeout(0) callback', 'macro'), 0);

    Promise.resolve().then(() => log('Promise.then #1', 'micro'));

    queueMicrotask(() => {
      log('queueMicrotask', 'micro');
      // microtask thêm microtask: vẫn được xả trong cùng vòng, trước macrotask
      queueMicrotask(() => log('queueMicrotask (nested)', 'micro'));
    });

    Promise.resolve().then(() => log('Promise.then #2', 'micro'));

    log("console.log('script end')", 'sync');
  }

  function runAwait() {
    clear();
    const inner = async () => {
      log('A: trước await (sync, chạy ngay khi gọi)', 'sync');
      await Promise.resolve();
      log('C: sau await (microtask)', 'micro');
      log('D: tiếp tục trong cùng microtask', 'micro');
    };
    void inner();
    log('B: ngay sau lời gọi hàm async (sync)', 'sync');
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Cách đọc">
        Số thứ tự bên trái là <b>trình tự thực thi thực tế</b>. Badge cho biết task thuộc loại
        nào. Hãy dự đoán trước khi bấm.
      </Callout>

      <DemoCard
        title="Thử nghiệm thứ tự thực thi"
        right={
          <Group gap="xs">
            <Button size="xs" leftSection={<IconPlayerPlay size={14} />} onClick={runClassic}>
              Ví dụ kinh điển
            </Button>
            <Button size="xs" color="grape" leftSection={<IconPlayerPlay size={14} />} onClick={runAwait}>
              await = microtask
            </Button>
            <Button size="xs" variant="default" leftSection={<IconRefresh size={14} />} onClick={clear}>
              Clear
            </Button>
          </Group>
        }
      >
        <Stack gap="sm">
          <div className="text-sm text-[var(--mantine-color-dimmed)]">
            <b>Ví dụ kinh điển:</b> kỳ vọng 2 dòng sync → tất cả microtask (kể cả nested) →
            cuối cùng setTimeout. <br />
            <b>await:</b> dòng B (sync sau lời gọi) chạy trước C/D (sau await).
          </div>
          <LogConsole logs={logs} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
