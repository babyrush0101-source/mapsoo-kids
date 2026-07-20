import {
  MAX_REFERENCE_IMAGE_BYTES,
  inspectReferenceImageBytes,
  type ReferenceImageMediaType,
  type ReferenceImageRole,
} from '../core/reference-image';

export interface BrowserReferenceImage {
  readonly role: ReferenceImageRole;
  readonly bytes: Uint8Array;
  readonly descriptor: {
    readonly id: string;
    readonly role: ReferenceImageRole;
    readonly path: string;
    readonly mediaType: ReferenceImageMediaType;
    readonly byteLength: number;
    readonly width: number;
    readonly height: number;
    readonly sha256: string;
    readonly rights: {
      readonly basis: 'owned';
      readonly license: 'LicenseRef-User-Owned';
      readonly allowGenerativeAdaptation: true;
      readonly allowOutputRedistribution: true;
    };
  };
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function readBrowserReferenceImage(file: File, role: ReferenceImageRole): Promise<BrowserReferenceImage> {
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_REFERENCE_IMAGE_BYTES) {
    throw new Error(`Reference image must be between 1 byte and ${MAX_REFERENCE_IMAGE_BYTES} bytes.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size) throw new Error('Reference image changed while it was being read.');
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  const mediaType: ReferenceImageMediaType | null = pngSignature.every((byte, index) => bytes[index] === byte)
    ? 'image/png'
    : bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : null;
  if (!mediaType) throw new Error('Reference image must contain PNG or JPEG bytes.');
  const dimensions = inspectReferenceImageBytes(bytes, mediaType);
  const shortRole = role === 'environment-style' ? 'environment' : 'character';
  return Object.freeze({
    role,
    bytes: bytes.slice(),
    descriptor: Object.freeze({
      id: `${shortRole}-reference`,
      role,
      // Deliberately canonical: browser/local filenames never cross the job boundary.
      path: `references/${shortRole}.${mediaType === 'image/png' ? 'png' : 'jpg'}`,
      mediaType,
      byteLength: bytes.byteLength,
      width: dimensions.width,
      height: dimensions.height,
      sha256: await sha256(bytes),
      rights: Object.freeze({
        basis: 'owned' as const,
        license: 'LicenseRef-User-Owned' as const,
        allowGenerativeAdaptation: true as const,
        allowOutputRedistribution: true as const,
      }),
    }),
  });
}
