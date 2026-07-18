import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const svgPath = join(projectRoot, 'public', 'favicon.svg');
const outDir = join(projectRoot, 'public', 'icons');

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const sizes = [96, 144, 152, 180, 192, 512];

for (const size of sizes) {
  await sharp(svgBuffer, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

console.log('\nAll icons generated in public/icons/');
