import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, MantineProvider } from '@mantine/core';
import { WorkbookApp } from '@sfe/workbook';
import { LEVEL } from './concepts';

import './index.css';

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <WorkbookApp level={LEVEL} />
    </MantineProvider>
  </StrictMode>,
);
