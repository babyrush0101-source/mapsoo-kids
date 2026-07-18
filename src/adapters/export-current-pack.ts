import packageJson from '../../package.json';
import { ALPHA2_PACK_VERSION } from '../core/pack-manifest-alpha2';
import {
  buildAlpha2PortablePack,
  downloadAlpha2PortablePack,
} from './export-browser-pack-alpha2';

if (packageJson.version !== ALPHA2_PACK_VERSION) {
  throw new Error(
    `Current package version ${packageJson.version} does not match the alpha.2 exporter ${ALPHA2_PACK_VERSION}.`,
  );
}

export const CURRENT_PACK_VERSION = ALPHA2_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha2PortablePack;
export const downloadCurrentPortablePack = downloadAlpha2PortablePack;
