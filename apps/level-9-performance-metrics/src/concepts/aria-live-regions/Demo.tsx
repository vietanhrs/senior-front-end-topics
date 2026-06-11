import { useRef, useState } from 'react';
import { Button, Group, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState('');
  const [atomic, setAtomic] = useState(true);
  const n = useRef(0);
  const results = useRef(3);

  // The regions below are REAL aria-live regions, present from mount — so with a
  // screen reader running they announce for real. The log models what an SR would
  // say (politeness ordering), since we can't capture speech in the page.
  const announce = (text: string, politeness: 'polite' | 'assertive') => {
    if (politeness === 'assertive') {
      log(`🔊 (assertive) INTERRUPTS → "${text}"`, 'error');
    } else {
      log(`🔊 (polite) queued, announces when idle → "${text}"`, 'macro');
    }
  };

  const updateStatus = () => {
    results.current += 1;
    const region = `${results.current} results`;
    setStatus(region);
    // atomic=true → whole region read; atomic=false → only the changed text
    announce(atomic ? region : `${results.current}`, 'polite');
  };

  const updateAlert = () => {
    n.current += 1;
    const msg = `Error: field ${n.current} is required`;
    setAlert(msg);
    announce(msg, 'assertive');
  };

  const rapidFire = () => {
    log('firing 5 polite updates in <100ms…', 'sync');
    for (let i = 1; i <= 5; i++) {
      results.current += 1;
      setStatus(`${results.current} results`);
    }
    log('⚠ a screen reader coalesces/drops rapid updates — it likely announces only the LAST. Debounce!', 'macro');
    announce(`${results.current} results`, 'polite');
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="Update live regions and see what a screen reader would announce">
        The two boxes below are real <code>role="status"</code> (polite) and <code>role="alert"</code>{' '}
        (assertive) regions, present from mount. Updating the polite one queues an announcement;
        the assertive one interrupts. Toggle <code>aria-atomic</code> to hear "5 results" (whole
        region) vs just "5" (the delta). With a screen reader on, these announce for real.
      </Callout>

      <Group>
        <Switch label="aria-atomic on status region" checked={atomic} onChange={(e) => setAtomic(e.currentTarget.checked)} />
      </Group>

      <Group>
        <Button color="teal" onClick={updateStatus}>Update status (polite)</Button>
        <Button color="red" onClick={updateAlert}>Trigger alert (assertive)</Button>
        <Button variant="light" onClick={rapidFire}>Rapid-fire 5 polite updates</Button>
        <Button variant="subtle" onClick={() => { clear(); setStatus(''); setAlert(''); }}>Clear</Button>
      </Group>

      <Group grow>
        <DemoCard title='role="status" · aria-live="polite"'>
          <div role="status" aria-atomic={atomic} className="rounded-md border p-3" style={{ minHeight: 44 }}>
            <Text size="sm">{status || <span style={{ opacity: 0.5 }}>(empty — present from mount)</span>}</Text>
          </div>
        </DemoCard>
        <DemoCard title='role="alert" · aria-live="assertive"'>
          <div role="alert" className="rounded-md border p-3" style={{ minHeight: 44 }}>
            <Text size="sm" c={alert ? 'red' : undefined}>{alert || <span style={{ opacity: 0.5 }}>(empty — present from mount)</span>}</Text>
          </div>
        </DemoCard>
      </Group>

      <LogConsole logs={logs} height={160} empty="Update the regions to see simulated screen-reader announcements." />
    </Stack>
  );
}
