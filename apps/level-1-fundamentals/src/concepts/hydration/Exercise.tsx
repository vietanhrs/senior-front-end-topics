import { useEffect, useState } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

/**
 * BUGGY component (mô phỏng): hiển thị thời gian hiện tại NGAY trong lúc render.
 * Trong SSR thật, server và client sẽ tính ra giá trị khác nhau → hydration
 * mismatch. Nhiệm vụ: làm cho lần render đầu tất định, cập nhật sau khi mount.
 */
function GreetingBuggy() {
  // ❌ Chạy khi render: ở SSR giá trị này khác giữa server và client
  const now = new Date().toLocaleTimeString();
  return <Text>Xin chào! Bây giờ là {now}.</Text>;
}

/** Một cách giải đúng để bạn so sánh sau khi tự làm. */
function GreetingFixed() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    setNow(new Date().toLocaleTimeString()); // chỉ ở client, SAU hydration
  }, []);
  return <Text>Xin chào! Bây giờ là {now ?? '…'}.</Text>;
}

const solution = `function Greeting() {
  // Lần render đầu trả về giá trị KHỚP với server (placeholder).
  const [now, setNow] = useState<string | null>(null);

  // useEffect không chạy khi SSR và chạy SAU hydration ở client,
  // nên không gây mismatch.
  useEffect(() => {
    setNow(new Date().toLocaleTimeString());
  }, []);

  return <Text>Xin chào! Bây giờ là {now ?? '…'}.</Text>;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: dập tắt hydration mismatch"
        description="Component dưới render time trực tiếp khi render → không tất định. Hãy sửa để lần render đầu khớp server, rồi cập nhật sau khi mount bằng useEffect."
      >
        <Stack gap="sm">
          <Group>
            <Badge color="red" variant="light">
              Buggy
            </Badge>
            <GreetingBuggy />
          </Group>
          <Group>
            <Badge color="teal" variant="light">
              Fixed
            </Badge>
            <GreetingFixed />
          </Group>
        </Stack>
      </DemoCard>

      <Callout kind="tip" title="Gợi ý">
        Mọi giá trị browser-only hoặc thay đổi theo thời gian/locale phải được đưa vào{' '}
        <code>useEffect</code> (chạy sau hydration), không phải tính trực tiếp khi render.
      </Callout>

      <SolutionReveal code={solution} />
    </Stack>
  );
}
