import packageJson from '../../package.json';
import { ALPHA3_PACK_VERSION } from '../core/pack-manifest-alpha3';
import {
  buildAlpha3PortablePack,
  downloadAlpha3PortablePack,
} from './export-browser-pack-alpha3';

if (packageJson.version !== ALPHA3_PACK_VERSION) {
  throw new Error(
    `Current package version ${packageJson.version} does not match the alpha.3 exporter ${ALPHA3_PACK_VERSION}.`,
  );
}

export const CURRENT_PACK_VERSION = ALPHA3_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha3PortablePack;
export const downloadCurrentPortablePack = downloadAlpha3PortablePack;
