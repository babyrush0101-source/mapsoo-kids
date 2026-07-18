import { GenerationProviderError } from '../core/generation-provider';

export function safeGenerationFailureMessage(error: unknown): string {
  return error instanceof GenerationProviderError
    ? `Generation failed (${error.code}).`
    : 'Generation failed before a valid world was returned.';
}

export function safeGenerationFailureLog(error: unknown): string {
  return error instanceof GenerationProviderError
    ? `Generation failed (${error.code}).`
    : 'Generation failed before a valid world was returned.';
}
