export interface GenerationRequest {
  readonly id: number;
  readonly signal: AbortSignal;
}

export class GenerationSession {
  private requestId = 0;
  private controller: AbortController | null = null;

  begin(): GenerationRequest {
    this.controller?.abort();
    this.controller = new AbortController();
    this.requestId += 1;
    return { id: this.requestId, signal: this.controller.signal };
  }

  isCurrent(request: GenerationRequest): boolean {
    return request.id === this.requestId && !request.signal.aborted;
  }

  cancel(): void {
    this.controller?.abort();
    this.controller = null;
    this.requestId += 1;
  }
}
