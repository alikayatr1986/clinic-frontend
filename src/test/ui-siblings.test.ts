import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const uiDir = join(here, '../components/ui');

describe('ui test siblings (triple rule)', () => {
  it('fails naming any ui/*.tsx without a *.test.tsx sibling', () => {
    const implementations = readdirSync(uiDir).filter(
      (file) =>
        file.endsWith('.tsx') && !file.endsWith('.test.tsx') && !file.endsWith('.stories.tsx'),
    );
    expect(implementations.length).toBeGreaterThan(0);
    const missing = implementations
      .map((file) => file.replace(/\.tsx$/, ''))
      .filter((base) => !existsSync(join(uiDir, `${base}.test.tsx`)));
    expect(
      missing,
      missing.length > 0 ? `Missing test siblings for: ${missing.join(', ')}` : 'all covered',
    ).toEqual([]);
  });

  it('fails naming any ui/*.tsx without a *.stories.tsx sibling', () => {
    const implementations = readdirSync(uiDir).filter(
      (file) =>
        file.endsWith('.tsx') && !file.endsWith('.test.tsx') && !file.endsWith('.stories.tsx'),
    );
    expect(implementations.length).toBeGreaterThan(0);
    const missing = implementations
      .map((file) => file.replace(/\.tsx$/, ''))
      .filter((base) => !existsSync(join(uiDir, `${base}.stories.tsx`)));
    expect(
      missing,
      missing.length > 0 ? `Missing story siblings for: ${missing.join(', ')}` : 'all covered',
    ).toEqual([]);
  });
});
