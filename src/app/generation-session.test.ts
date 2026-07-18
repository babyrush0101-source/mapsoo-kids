import { describe, expect, it } from 'vitest';
import { GenerationSession } from './generation-session';

describe('generation session', () => {
  it('keeps only the latest request current and aborts the previous signal', () => {
    const session = new GenerationSession();
    const first = session.begin();
    const second = session.begin();

    expect(first.signal.aborted).toBe(true);
    expect(session.isCurrent(first)).toBe(false);
    expect(second.signal.aborted).toBe(false);
    expect(session.isCurrent(second)).toBe(true);
  });

  it('invalidates an in-flight request on cancellation', () => {
    const session = new GenerationSession();
    const request = session.begin();

    session.cancel();

    expect(request.signal.aborted).toBe(true);
    expect(session.isCurrent(request)).toBe(false);
  });

  it('prevents a delayed stale request from applying after a newer request begins', async () => {
    const session = new GenerationSession();
    const applied: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = session.begin();
    const delayedFirst = firstGate.then(() => {
      if (session.isCurrent(first)) applied.push('first');
    });

    const second = session.begin();
    if (session.isCurrent(second)) applied.push('second');
    releaseFirst?.();
    await delayedFirst;

    expect(applied).toEqual(['second']);
  });
});
