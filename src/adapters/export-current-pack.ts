import { ALPHA7_PACK_VERSION } from '../core/pack-manifest-alpha7';
import {
  buildAlpha7PortablePack,
  downloadAlpha7PortablePack,
} from './export-browser-pack-alpha7';

// The workbench may expose the next candidate exporter while package.json and
// CURRENT_PUBLIC_RELEASE remain pinned to the last immutable public release.
export const CURRENT_PACK_VERSION = ALPHA7_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha7PortablePack;
export const downloadCurrentPortablePack = downloadAlpha7PortablePack;
