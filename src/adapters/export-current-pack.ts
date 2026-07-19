import packageJson from '../../package.json';
import { ALPHA5_PACK_VERSION } from '../core/pack-manifest-alpha5';
import {
  buildAlpha5PortablePack,
  downloadAlpha5PortablePack,
} from './export-browser-pack-alpha5';

if (packageJson.version !== ALPHA5_PACK_VERSION) {
  throw new Error(
    `Current package version ${packageJson.version} does not match the alpha.5 exporter ${ALPHA5_PACK_VERSION}.`,
  );
}

export const CURRENT_PACK_VERSION = ALPHA5_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha5PortablePack;
export const downloadCurrentPortablePack = downloadAlpha5PortablePack;
