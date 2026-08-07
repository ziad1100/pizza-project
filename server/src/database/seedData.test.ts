import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import slugify from 'slugify';
import { seedSections, bestSellerNames, offerNames, type SeedItem, type SeedSub } from './seedData';

// Guards the ORABI catalog against regressions like the one that wiped the
// dish photos / menu sections from the seed. If any product loses its image
// or the menu shrinks, this suite fails loudly.
const PUBLIC_PRODUCTS_DIR = fileURLToPath(new URL('../../../public/images/products', import.meta.url));

const slugifyEn = (text: string): string => slugify(text, { lower: true, strict: true });

const productImagePath = (item: SeedItem, sub: SeedSub): string => {
  const url = item.image ?? `/images/products/${slugifyEn(item.en)}-${slugifyEn(sub.en)}.jpg`;
  return path.join(PUBLIC_PRODUCTS_DIR, path.basename(url));
};

describe('seed catalog integrity (ORABI menu)', () => {
  const pairs = seedSections.flatMap((section) =>
    section.subs.flatMap((sub) => sub.items.map((item) => ({ item, sub, section }))),
  );

  it('has the documented 6 sections and 18 sub-sections', () => {
    expect(seedSections).toHaveLength(6);
    expect(seedSections.flatMap((s) => s.subs)).toHaveLength(18);
  });

  it('has 107 products', () => {
    expect(pairs).toHaveLength(107);
  });

  it('every product maps to an existing dish photo in public/images/products', () => {
    const missing = pairs
      .filter(({ item, sub }) => !fs.existsSync(productImagePath(item, sub)))
      .map(({ item, sub, section }) => `${section.en} / ${sub.en} / ${item.en} -> ${productImagePath(item, sub)}`);
    expect(missing).toEqual([]);
  });

  it('every best-seller and offer name resolves to a real item', () => {
    const names = new Set(pairs.map(({ item }) => item.ar));
    const unknown = [...bestSellerNames, ...offerNames].filter((n) => !names.has(n));
    expect(unknown).toEqual([]);
  });

  it('every product has at least one offered size', () => {
    const invalid = pairs
      .filter(({ item }) => item.prices.every((p) => p === null))
      .map(({ item, section }) => `${section.en} / ${item.en}`);
    expect(invalid).toEqual([]);
  });
});
