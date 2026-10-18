import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const uiDir = join(here, '../components/ui');

const componentFiles = readdirSync(uiDir, { withFileTypes: true })
  .filter(
  (entry) =>
    entry.isFile() &&
    /\.tsx$/.test(entry.name) &&
    !entry.name.endsWith('.test.tsx') &&
    !entry.name.endsWith('.stories.tsx'),
  )
  .map((entry) => entry.name.slice(0, -4));

describe('ui test siblings (triple rule)', () => {
  it('fails naming any ui/*.tsx without a *.test.tsx sibling', () => {
  const missing = componentFiles.filter((name) => !existsSync(join(uiDir, `${name}.test.tsx`)));
  expect(missing).toEqual([]);
  });

  it('fails naming any ui/*.tsx without a *.stories.tsx sibling', () => {
  const missing = componentFiles.filter((name) => !existsSync(join(uiDir, `${name}.stories.tsx`)));
  expect(missing).toEqual([]);
  });
});
