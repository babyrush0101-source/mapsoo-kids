#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseDocument } from 'yaml';

import { REPOSITORY_ROOT } from './release-config.mjs';

const workflows = ['ci.yml', 'release.yml', 'pages.yml'];

try {
  for (const name of workflows) {
    const path = join(REPOSITORY_ROOT, '.github', 'workflows', name);
    const source = await readFile(path, 'utf8');
    const document = parseDocument(source, { prettyErrors: true, strict: true, uniqueKeys: true });
    if (document.errors.length > 0) throw new Error(`${name}: ${document.errors.map(String).join('\n')}`);
    const workflow = document.toJS();
    if (!workflow || typeof workflow !== 'object' || typeof workflow.name !== 'string' || !workflow.jobs) {
      throw new Error(`${name}: workflow must declare a name and jobs object.`);
    }
  }
  console.log(`MAPSOO_WORKFLOW_YAML_OK files=${workflows.length}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
