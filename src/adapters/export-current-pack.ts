import { ALPHA7_PACK_VERSION } from '../core/pack-manifest-alpha7';
import {
  buildAlpha7PortablePack,
  downloadAlpha7PortablePack,
} from './export-browser-pack-alpha7';

// Keep the workbench exporter and the immutable public-release ledger on the
// same version after publication; the ledger separately pins remote digests.
export const CURRENT_PACK_VERSION = ALPHA7_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha7PortablePack;
export const downloadCurrentPortablePack = downloadAlpha7PortablePack;
