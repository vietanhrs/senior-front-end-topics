import { List, Stack, ThemeIcon } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const scenarios = [
  'A. Trang dùng Google Fonts (font tải từ fonts.gstatic.com).',
  'B. Ảnh hero là phần tử LCP nhưng URL chỉ lộ ra trong JS sau khi app chạy.',
  'C. Khi người dùng đăng nhập xong, gần như chắc chắn họ sẽ vào /dashboard.',
  'D. Web font woff2 khai báo trong file CSS, cần render text trên màn hình đầu.',
  'E. Bạn có 8 origin bên thứ ba, nhưng chỉ 1 origin được dùng ngay khi load.',
];

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard title="Bài tập: chọn resource hint đúng cho từng tình huống">
        <List
          spacing="xs"
          icon={
            <ThemeIcon color="indigo" size={20} radius="xl">
              <IconQuestionMark size={12} />
            </ThemeIcon>
          }
        >
          {scenarios.map((s) => (
            <List.Item key={s}>{s}</List.Item>
          ))}
        </List>
      </DemoCard>

      <Callout kind="tip" title="Trước khi mở lời giải">
        Tự hỏi: tài nguyên này cho <i>trang hiện tại</i> hay <i>trang sau</i>? Cần <i>kết nối</i>{' '}
        hay <i>chính tài nguyên</i>? Có cần ưu tiên cao không?
      </Callout>

      <SolutionReveal
        language="text"
        notes="Đáp án & lý do:"
        code={`A → preconnect tới https://fonts.gstatic.com (crossorigin), kèm
     dns-prefetch làm fallback. Ta CHẮC sẽ tải từ origin đó, cần
     mở sẵn DNS+TCP+TLS.

B → preload as=image + fetchpriority="high". Ảnh LCP bị phát hiện
     muộn (trong JS), preload kéo nó lên sớm với ưu tiên cao.

C → prefetch chunk/route /dashboard. Đây là điều hướng TƯƠNG LAI,
     ưu tiên thấp, cất vào cache cho lần sau.

D → preload as=font type=font/woff2 crossorigin. Font cần ngay cho
     first paint, nếu không sẽ FOUT/FOIT. (Font luôn fetch CORS → crossorigin.)

E → CHỈ preconnect origin được dùng ngay (1 cái). 7 origin còn lại
     đừng preconnect (lãng phí kết nối); cùng lắm dns-prefetch.`}
      />
    </Stack>
  );
}
