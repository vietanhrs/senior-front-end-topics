import { Button, Stack } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, LogConsole, SolutionReveal, useLogger } from '../../workbook/ui';

const snippet = `console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => {
  console.log('3');
  // microtask này SINH RA một microtask khác
  Promise.resolve().then(() => console.log('4'));
});

Promise.resolve().then(() => console.log('5'));

console.log('6');`;

export function Exercise() {
  const { logs, log, clear } = useLogger();

  function run() {
    clear();
    log('1', 'sync');
    setTimeout(() => log('2', 'macro'), 0);
    Promise.resolve().then(() => {
      log('3', 'micro');
      Promise.resolve().then(() => log('4', 'micro'));
    });
    Promise.resolve().then(() => log('5', 'micro'));
    log('6', 'sync');
  }

  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: dự đoán thứ tự in"
        description="Viết ra thứ tự bạn nghĩ các số sẽ được in. Bấm Run để đối chiếu, rồi mở lời giải. Câu hỏi mấu chốt: microtask (4) sinh ra trong lúc xả queue sẽ chạy trước hay sau (5)? Và trước hay sau macrotask (2)?"
      >
        <Stack gap="sm">
          <CodeHighlight code={snippet} language="js" radius="md" />
          <Button size="xs" leftSection={<IconPlayerPlay size={14} />} onClick={run} w="fit-content">
            Run & đối chiếu
          </Button>
          <LogConsole logs={logs} height={200} />
        </Stack>
      </DemoCard>

      <Callout kind="tip" title="Gợi ý">
        Microtask queue được <b>xả sạch</b> trước khi tới macrotask — kể cả những microtask
        được thêm vào <i>trong lúc</i> đang xả. Nhưng chúng được xếp vào <b>cuối</b> queue hiện tại.
      </Callout>

      <SolutionReveal
        language="text"
        notes="Thứ tự đúng: 1 → 6 → 3 → 5 → 4 → 2"
        code={`Pha đồng bộ:
  1  console.log('1')
  6  console.log('6')   // setTimeout & các .then chỉ ĐĂNG KÝ, chưa chạy

Xả microtask queue. Lúc bắt đầu xả, queue = [A→3, B→5]:
  3  chạy callback A. Trong lúc chạy, nó ĐĂNG KÝ thêm microtask C→4,
     C được đẩy vào CUỐI queue: queue = [B→5, C→4]
  5  chạy callback B (đã có sẵn từ đầu, đứng trước C)
  4  chạy callback C (microtask mới sinh ra, vẫn được xả trong cùng vòng)
     -> queue rỗng

Macrotask:
  2  setTimeout(0) — chỉ chạy SAU khi microtask queue đã rỗng hoàn toàn

=> Bài học: microtask mới luôn được xả hết trước khi tới macrotask kế tiếp.
   Đây là cơ chế gây "microtask starvation": nếu cứ liên tục đẻ microtask,
   (2) và cả việc render sẽ không bao giờ tới lượt.`}
      />
    </Stack>
  );
}
