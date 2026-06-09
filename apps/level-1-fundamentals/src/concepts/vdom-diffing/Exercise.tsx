import { useState } from 'react';
import { Button, Checkbox, Group, Stack, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

interface Task {
  id: number;
  label: string;
}

const SEED: Task[] = [
  { id: 1, label: 'Đọc lý thuyết hydration' },
  { id: 2, label: 'Làm demo event loop' },
  { id: 3, label: 'Ôn CORS preflight' },
];

/**
 * BUG: dùng `index` làm key trong một list CÓ thể xoá phần tử. Tick checkbox
 * dòng đầu rồi xoá nó → checkbox "tích" nhảy sang dòng kế tiếp vì state DOM của
 * checkbox bị gắn theo vị trí, không theo task. Hãy đổi sang key ổn định.
 */
export function Exercise() {
  const [tasks, setTasks] = useState(SEED);
  const remove = (id: number) => setTasks((t) => t.filter((x) => x.id !== id));
  const reset = () => setTasks(SEED);

  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: sửa key cho danh sách có thể xoá"
        description="Tick checkbox dòng ĐẦU (uncontrolled), sau đó bấm xoá dòng đó. Vì đang dùng key=index, dấu tick sẽ dính sai. Nhiệm vụ: đổi sang key={task.id}."
      >
        <Stack gap="xs">
          {/* ❌ key={index} — nguồn gốc của bug */}
          {tasks.map((task, index) => (
            <Group key={index} justify="space-between">
              <Checkbox label={task.label} />
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => remove(task.id)}
              >
                Xoá
              </Button>
            </Group>
          ))}
          {tasks.length === 0 && <Text c="dimmed">Hết task.</Text>}
        </Stack>
        <Button mt="md" size="xs" variant="default" onClick={reset}>
          Reset
        </Button>
      </DemoCard>

      <Callout kind="tip" title="Gợi ý">
        Checkbox ở đây là <i>uncontrolled</i> nên trạng thái tick sống trong DOM. Key quyết
        định DOM node nào được giữ lại khi list thay đổi. Index không ổn định khi xoá phần tử.
      </Callout>

      <SolutionReveal
        notes="Chỉ cần đổi key. Với list động (thêm/xoá/sắp xếp), luôn dùng id ổn định."
        code={`{tasks.map((task) => (
  <Group key={task.id} justify="space-between">
    <Checkbox label={task.label} />
    <Button onClick={() => remove(task.id)}>Xoá</Button>
  </Group>
))}`}
      />
    </Stack>
  );
}
