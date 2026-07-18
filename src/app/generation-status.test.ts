import { describe, expect, it } from 'vitest';
import { GenerationProviderError } from '../core/generation-provider';
import { safeGenerationFailureLog, safeGenerationFailureMessage } from './generation-status';

describe('generation status messages', () => {
  it('exposes a stable error code without leaking a vendor cause', () => {
    const error = new GenerationProviderError(
      'provider.execution-failed',
      'Generation with remote-provider@1.0.0 failed.',
      { cause: new Error('secret vendor response') },
    );

    expect(safeGenerationFailureMessage(error)).toBe('Generation failed (provider.execution-failed).');
    expect(safeGenerationFailureMessage(error)).not.toContain('secret vendor response');
    expect(safeGenerationFailureLog(error)).not.toContain(error.message);
    expect(safeGenerationFailureLog(error)).not.toContain('secret vendor response');
    expect(safeGenerationFailureLog(error)).toBe('Generation failed (provider.execution-failed).');
  });

  it('uses a generic message for unknown failures', () => {
    expect(safeGenerationFailureMessage(new Error('private detail'))).toBe(
      'Generation failed before a valid world was returned.',
    );
  });
});
