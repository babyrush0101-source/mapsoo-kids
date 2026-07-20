const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_PATH_SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;
const SHA256 = /^[a-f0-9]{64}$/;
const LICENSE = /^(?:CC0-1\.0|CC-BY-4\.0|CC-BY-SA-4\.0|LicenseRef-[A-Za-z0-9][A-Za-z0-9.-]{0,79})$/;

export const REFERENCE_IMAGE_ROLES = Object.freeze(['environment-style', 'character'] as const);
export type ReferenceImageRole = typeof REFERENCE_IMAGE_ROLES[number];

export const REFERENCE_IMAGE_MEDIA_TYPES = Object.freeze(['image/png', 'image/jpeg'] as const);
export type ReferenceImageMediaType = typeof REFERENCE_IMAGE_MEDIA_TYPES[number];

export const REFERENCE_IMAGE_RIGHTS_BASES = Object.freeze(['owned', 'licensed', 'public-domain'] as const);
export type ReferenceImageRightsBasis = typeof REFERENCE_IMAGE_RIGHTS_BASES[number];

export const MAX_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_REFERENCE_IMAGE_DIMENSION = 8192;
export const MAX_REFERENCE_IMAGE_PIXELS = 16_777_216;

export interface ReferenceImageRights {
  readonly basis: ReferenceImageRightsBasis;
  readonly license: string;
  readonly allowGenerativeAdaptation: true;
  readonly allowOutputRedistribution: true;
  /** Explicit permission to dedicate newly generated output under CC0-1.0. */
  readonly allowOutputCc0Dedication: true;
  readonly attribution?: string;
}

/** JSON-safe metadata. Raw image bytes deliberately do not belong to this contract. */
export interface ReferenceImageDescriptor {
  readonly id: string;
  readonly role: ReferenceImageRole;
  readonly path: string;
  readonly mediaType: ReferenceImageMediaType;
  readonly byteLength: number;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly rights: ReferenceImageRights;
}

export interface RuntimeReferenceImage {
  readonly descriptor: ReferenceImageDescriptor;
  readonly byteLength: number;
  /** Returns a fresh copy so validated bytes cannot be mutated after binding. */
  readBytes(): Uint8Array;
}

export type ReferenceImageErrorCode =
  | 'reference.invalid-descriptor'
  | 'reference.invalid-rights'
  | 'reference.invalid-bytes'
  | 'reference.mime-mismatch'
  | 'reference.dimension-mismatch'
  | 'reference.hash-mismatch';

export class ReferenceImageError extends Error {
  constructor(readonly code: ReferenceImageErrorCode, message: string) {
    super(message);
    this.name = 'ReferenceImageError';
  }
}

function fail(code: ReferenceImageErrorCode, message: string): never {
  throw new ReferenceImageError(code, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[], label: string): void {
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  if (required.some((key) => !Object.hasOwn(value, key)) || keys.some((key) => !allowed.has(key))) {
    fail('reference.invalid-descriptor', `${label} must contain only the declared fields.`);
  }
}

function boundedText(value: unknown, label: string, maximum: number, allowEmpty = false): string {
  if (
    typeof value !== 'string'
    || Array.from(value).length > maximum
    || (!allowEmpty && value.trim().length === 0)
    || value !== value.trim()
    || /[\u0000-\u001f\u007f-\u009f]/.test(value)
  ) {
    fail('reference.invalid-descriptor', `${label} is invalid.`);
  }
  return value;
}

export function isSafeReferencePath(value: string): boolean {
  return value.length <= 240
    && !value.includes('\\')
    && !value.startsWith('/')
    && !/^[A-Za-z]:/.test(value)
    && value.split('/').every((segment) => SAFE_PATH_SEGMENT.test(segment) && segment !== '.' && segment !== '..');
}

function positiveInteger(value: unknown, label: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > maximum) {
    fail('reference.invalid-descriptor', `${label} must be an integer from 1 to ${maximum}.`);
  }
  return value as number;
}

function materializeRights(value: unknown): ReferenceImageRights {
  if (!isRecord(value)) fail('reference.invalid-rights', 'Reference image rights must be an object.');
  const required = ['basis', 'license', 'allowGenerativeAdaptation', 'allowOutputRedistribution', 'allowOutputCc0Dedication'];
  const optional = ['attribution'];
  const keys = Object.keys(value);
  if (required.some((key) => !Object.hasOwn(value, key)) || keys.some((key) => !required.includes(key) && !optional.includes(key))) {
    fail('reference.invalid-rights', 'Reference image rights must contain only the declared fields.');
  }
  if (!REFERENCE_IMAGE_RIGHTS_BASES.includes(value.basis as ReferenceImageRightsBasis)) {
    fail('reference.invalid-rights', 'Reference image rights basis is unsupported.');
  }
  if (typeof value.license !== 'string' || !LICENSE.test(value.license)) {
    fail('reference.invalid-rights', 'Reference image rights license must be an allowlisted SPDX ID or LicenseRef.');
  }
  if (value.allowGenerativeAdaptation !== true) {
    fail('reference.invalid-rights', 'Reference image rights must explicitly allow generative adaptation.');
  }
  if (value.allowOutputRedistribution !== true) {
    fail('reference.invalid-rights', 'Reference image rights must explicitly allow generated output redistribution.');
  }
  if (value.allowOutputCc0Dedication !== true) {
    fail('reference.invalid-rights', 'Reference image rights must explicitly allow generated output CC0 dedication.');
  }
  const attribution = value.attribution === undefined
    ? undefined
    : boundedText(value.attribution, 'Reference image attribution', 500);
  if (value.basis === 'licensed' && attribution === undefined) {
    fail('reference.invalid-rights', 'Licensed reference images require attribution text.');
  }
  return Object.freeze({
    basis: value.basis as ReferenceImageRightsBasis,
    license: value.license,
    allowGenerativeAdaptation: true,
    allowOutputRedistribution: true,
    allowOutputCc0Dedication: true,
    ...(attribution === undefined ? {} : { attribution }),
  });
}

export function materializeReferenceImageDescriptor(value: unknown): ReferenceImageDescriptor {
  if (!isRecord(value)) fail('reference.invalid-descriptor', 'Reference image descriptor must be an object.');
  exactKeys(
    value,
    ['id', 'role', 'path', 'mediaType', 'byteLength', 'width', 'height', 'sha256', 'rights'],
    [],
    'Reference image descriptor',
  );
  const id = boundedText(value.id, 'Reference image id', 64);
  if (!ID.test(id)) fail('reference.invalid-descriptor', 'Reference image id must use lowercase kebab-case.');
  if (!REFERENCE_IMAGE_ROLES.includes(value.role as ReferenceImageRole)) {
    fail('reference.invalid-descriptor', 'Reference image role is unsupported.');
  }
  const path = boundedText(value.path, 'Reference image path', 240);
  if (!isSafeReferencePath(path)) fail('reference.invalid-descriptor', 'Reference image path must be safe and relative.');
  if (!REFERENCE_IMAGE_MEDIA_TYPES.includes(value.mediaType as ReferenceImageMediaType)) {
    fail('reference.invalid-descriptor', 'Reference image mediaType must be image/png or image/jpeg.');
  }
  const byteLength = positiveInteger(value.byteLength, 'Reference image byteLength', MAX_REFERENCE_IMAGE_BYTES);
  const width = positiveInteger(value.width, 'Reference image width', MAX_REFERENCE_IMAGE_DIMENSION);
  const height = positiveInteger(value.height, 'Reference image height', MAX_REFERENCE_IMAGE_DIMENSION);
  if (width * height > MAX_REFERENCE_IMAGE_PIXELS) {
    fail('reference.invalid-descriptor', `Reference image may contain at most ${MAX_REFERENCE_IMAGE_PIXELS} pixels.`);
  }
  if (typeof value.sha256 !== 'string' || !SHA256.test(value.sha256)) {
    fail('reference.invalid-descriptor', 'Reference image sha256 must be lowercase hexadecimal.');
  }
  return Object.freeze({
    id,
    role: value.role as ReferenceImageRole,
    path,
    mediaType: value.mediaType as ReferenceImageMediaType,
    byteLength,
    width,
    height,
    sha256: value.sha256,
    rights: materializeRights(value.rights),
  });
}

function pngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.byteLength < 33 || signature.some((value, index) => bytes[index] !== value)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') return null;
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (bytes[24] !== 8 || ![0, 2, 3, 4, 6].includes(bytes[25]) || bytes[26] !== 0 || bytes[27] !== 0 || ![0, 1].includes(bytes[28])) {
    return null;
  }
  return { width, height };
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.byteLength) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.byteLength && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.byteLength) return null;
    const length = view.getUint16(offset);
    if (length < 2 || offset + length > bytes.byteLength) return null;
    const isStartOfFrame = marker !== undefined && (
      (marker >= 0xc0 && marker <= 0xc3)
      || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb)
      || (marker >= 0xcd && marker <= 0xcf)
    );
    if (isStartOfFrame) {
      if (length < 8) return null;
      return { height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
    }
    offset += length;
  }
  return null;
}

export function inspectReferenceImageBytes(
  bytes: Uint8Array,
  mediaType: ReferenceImageMediaType,
): { readonly width: number; readonly height: number } {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
    fail('reference.invalid-bytes', 'Reference image bytes are missing or exceed the size limit.');
  }
  const dimensions = mediaType === 'image/png' ? pngDimensions(bytes) : jpegDimensions(bytes);
  if (!dimensions) fail('reference.mime-mismatch', `Reference image bytes do not match ${mediaType}.`);
  if (
    dimensions.width < 1 || dimensions.height < 1
    || dimensions.width > MAX_REFERENCE_IMAGE_DIMENSION || dimensions.height > MAX_REFERENCE_IMAGE_DIMENSION
    || dimensions.width * dimensions.height > MAX_REFERENCE_IMAGE_PIXELS
  ) {
    fail('reference.dimension-mismatch', 'Reference image dimensions exceed the supported budget.');
  }
  return Object.freeze(dimensions);
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', input.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function bindReferenceImage(descriptorValue: unknown, byteValue: Uint8Array): Promise<RuntimeReferenceImage> {
  const descriptor = materializeReferenceImageDescriptor(descriptorValue);
  if (!(byteValue instanceof Uint8Array) || byteValue.byteLength < 1 || byteValue.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
    fail('reference.invalid-bytes', 'Reference image bytes are missing or exceed the size limit.');
  }
  if (byteValue.byteLength !== descriptor.byteLength) {
    fail('reference.invalid-bytes', 'Reference image byteLength does not match the runtime bytes.');
  }
  const dimensions = inspectReferenceImageBytes(byteValue, descriptor.mediaType);
  if (dimensions.width !== descriptor.width || dimensions.height !== descriptor.height) {
    fail('reference.dimension-mismatch', 'Reference image dimensions do not match the descriptor.');
  }
  if (dimensions.width * dimensions.height > MAX_REFERENCE_IMAGE_PIXELS) {
    fail('reference.dimension-mismatch', `Reference image may contain at most ${MAX_REFERENCE_IMAGE_PIXELS} pixels.`);
  }
  if (await sha256(byteValue) !== descriptor.sha256) {
    fail('reference.hash-mismatch', 'Reference image SHA-256 does not match the runtime bytes.');
  }
  const snapshot = Uint8Array.from(byteValue);
  return Object.freeze({
    descriptor,
    byteLength: snapshot.byteLength,
    readBytes: () => Uint8Array.from(snapshot),
  });
}
