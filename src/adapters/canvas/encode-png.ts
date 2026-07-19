import pako from 'pako';

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_DIMENSION = 8192;
const MAX_PIXELS = 16 * 1024 * 1024;

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value >>> 0);
}

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  if (!/^[A-Z]{4}$/.test(type)) throw new Error(`Invalid PNG chunk type: ${type}`);
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.byteLength);
  writeUint32(chunk, 0, data.byteLength);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  writeUint32(chunk, 8 + data.byteLength, crc32(chunk.subarray(4, 8 + data.byteLength)));
  return chunk;
}

function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

/**
 * Encodes RGBA pixels with a pinned pure-JavaScript DEFLATE implementation.
 * This avoids browser-native canvas.toBlob() metadata/compression drift and
 * makes the exported PNG bytes reproducible across supported browsers and OSes.
 */
export function encodeRgbaPng(
  width: number,
  height: number,
  rgba: Uint8Array | Uint8ClampedArray,
): Uint8Array {
  if (
    !Number.isSafeInteger(width)
    || !Number.isSafeInteger(height)
    || width < 1
    || height < 1
    || width > MAX_DIMENSION
    || height > MAX_DIMENSION
    || width * height > MAX_PIXELS
  ) {
    throw new Error('PNG dimensions are outside the supported export budget.');
  }
  const expectedBytes = width * height * 4;
  if (rgba.byteLength !== expectedBytes) {
    throw new Error(`RGBA byte length ${rgba.byteLength} does not match ${width}x${height}.`);
  }

  const rowBytes = width * 4;
  const filtered = new Uint8Array((rowBytes + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const filteredOffset = row * (rowBytes + 1);
    filtered[filteredOffset] = 0;
    filtered.set(rgba.subarray(row * rowBytes, (row + 1) * rowBytes), filteredOffset + 1);
  }

  const ihdr = new Uint8Array(13);
  writeUint32(ihdr, 0, width);
  writeUint32(ihdr, 4, height);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const compressed = pako.deflate(filtered, { level: 9 });

  return concatenate([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', new Uint8Array()),
  ]);
}

export function encodeCanvasPng(canvas: HTMLCanvasElement): Blob {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is unavailable for deterministic PNG encoding.');
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const png = encodeRgbaPng(canvas.width, canvas.height, image.data);
  const buffer = new ArrayBuffer(png.byteLength);
  new Uint8Array(buffer).set(png);
  return new Blob([buffer], { type: 'image/png' });
}
