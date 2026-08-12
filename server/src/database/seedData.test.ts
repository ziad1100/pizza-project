import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import slugify from 'slugify';
import { seedSections, bestSellerNames, offerNames, galleryImagesSeed, type SeedItem, type SeedSub } from './seedData';

// Photos intentionally shared between products: ingredient add-ons reuse the
// same topping close-up as the dish, and the two crispy-chicken pizzas share
// one photo. Anything else that shares a photo is a mapping bug.
const INTENTIONAL_SHARED = new Set([
  'chicken-chicken.jpg', // Add-on Chicken + Chicken Pizza
  'beef-meat.jpg', // Add-on Meat + Minced Meat Pizza
  'mozzarella-cheese.jpg', // Add-on Mozzarella + Mozzarella Pizza
  'kiri-cheese-cheese.jpg', // Add-on Kiri + Kiri Cheese Pizza
  'roumy-cheese-cheese.jpg', // Roman Cheese Crepe + Roman Cheese Pizza
  'crispy-chicken-chicken.jpg', // Crispy Chicken Pizza + Crunchy Chicken Pizza
]);

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

  it('has the documented 9 sections and 22 sub-sections', () => {
    expect(seedSections).toHaveLength(9);
    expect(seedSections.flatMap((s) => s.subs)).toHaveLength(22);
  });

  it('has 123 products (68 existing + 55 restored pizza items)', () => {
    expect(pairs).toHaveLength(123);
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

  it('every curated gallery image exists and uses a unique file', () => {
    const seen = new Set<string>();
    const problems = galleryImagesSeed
      .map((g) => {
        const file = path.join(PUBLIC_PRODUCTS_DIR, path.basename(g.image));
        if (!fs.existsSync(file)) return `missing file: ${g.image}`;
        if (seen.has(g.image)) return `duplicate image: ${g.image}`;
        seen.add(g.image);
        return null;
      })
      .filter((p): p is string => Boolean(p));
    expect(problems).toEqual([]);
    expect(galleryImagesSeed).toHaveLength(24);
  });

  it('no unrelated products share a dish photo', () => {
    const byImage = new Map<string, Array<{ ar: string; en: string }>>();
    for (const { item, sub } of pairs) {
      const url = item.image ?? `/images/products/${slugifyEn(item.en)}-${slugifyEn(sub.en)}.jpg`;
      if (!byImage.has(url)) byImage.set(url, []);
      byImage.get(url)!.push({ ar: item.ar, en: item.en });
    }
    const violations: string[] = [];
    for (const [url, group] of byImage) {
      if (group.length < 2) continue;
      const file = path.basename(url);
      // The same dish sold in both pizza sections legitimately shares a photo.
      const sameFlavor = group.every((g) => g.ar === group[0].ar);
      if (sameFlavor || INTENTIONAL_SHARED.has(file)) continue;
      violations.push(`${file}: ${group.map((g) => `${g.en} (${g.ar})`).join(' | ')}`);
    }
    expect(violations).toEqual([]);
  });

});
