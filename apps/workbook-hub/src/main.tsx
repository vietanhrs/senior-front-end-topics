import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, MantineProvider } from '@mantine/core';
import { WorkbookApp } from '@sfe/workbook';
import { LEVELS } from './levels';

// All stylesheet imports + CSS layer ordering live in index.css.
import './index.css';

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <WorkbookApp levels={LEVELS} />
    </MantineProvider>
  </StrictMode>,
);
