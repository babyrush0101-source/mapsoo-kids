import packageJson from '../../package.json';
import { ALPHA4_PACK_VERSION } from '../core/pack-manifest-alpha4';
import {
  buildAlpha4PortablePack,
  downloadAlpha4PortablePack,
} from './export-browser-pack-alpha4';

if (packageJson.version !== ALPHA4_PACK_VERSION) {
  throw new Error(
    `Current package version ${packageJson.version} does not match the alpha.4 exporter ${ALPHA4_PACK_VERSION}.`,
  );
}

export const CURRENT_PACK_VERSION = ALPHA4_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha4PortablePack;
export const downloadCurrentPortablePack = downloadAlpha4PortablePack;
