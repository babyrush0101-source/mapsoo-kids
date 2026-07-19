import packageJson from '../../package.json';
import { ALPHA6_PACK_VERSION } from '../core/pack-manifest-alpha6';
import {
  buildAlpha6PortablePack,
  downloadAlpha6PortablePack,
} from './export-browser-pack-alpha6';

if (packageJson.version !== ALPHA6_PACK_VERSION) {
  throw new Error(
    `Current package version ${packageJson.version} does not match the alpha.6 exporter ${ALPHA6_PACK_VERSION}.`,
  );
}

export const CURRENT_PACK_VERSION = ALPHA6_PACK_VERSION;
export const buildCurrentPortablePack = buildAlpha6PortablePack;
export const downloadCurrentPortablePack = downloadAlpha6PortablePack;
