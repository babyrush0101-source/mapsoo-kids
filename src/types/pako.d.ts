declare module 'pako' {
  export interface DeflateOptions {
    readonly level?: number;
  }

  export interface PakoApi {
    deflate(data: Uint8Array, options?: DeflateOptions): Uint8Array;
    inflate(data: Uint8Array): Uint8Array;
  }

  const pako: PakoApi;
  export default pako;
}
