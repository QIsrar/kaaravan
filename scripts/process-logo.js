const sharp = require('sharp');
const fs = require('fs');

async function processLogo() {
  console.log('Processing Veiled Canvas logo assets...');

  // The emblem circle is centered at x: 512, y: 428 with diameter ~476px.
  // Extract a 520x520 square exactly centered at (512, 428):
  // left: 252, top: 168, width: 520, height: 520 (ends at y: 688, safely above text at y: 720)
  const croppedEmblem = await sharp('public/images/logo.jpg')
    .extract({ left: 252, top: 168, width: 520, height: 520 })
    .resize(512, 512)
    .toBuffer();

  // Create clean circular mask with radius 246
  const circleMask = Buffer.from(
    `<svg width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="246" fill="white" />
    </svg>`
  );

  const transparentEmblem = await sharp(croppedEmblem)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile('public/images/logo-mark.png');

  console.log('Generated public/images/logo-mark.png (512x512)');

  // 2. High-res app icons for Next.js App Router
  // Next.js App router checks:
  // - src/app/icon.png (used as favicon / browser tab icon)
  // - src/app/apple-icon.png (used on iOS home screen)
  // - public/favicon.ico
  // - public/icon.png
  // - public/apple-icon.png
  await sharp('public/images/logo-mark.png')
    .resize(512, 512)
    .png()
    .toFile('src/app/icon.png');

  await sharp('public/images/logo-mark.png')
    .resize(512, 512)
    .png()
    .toFile('public/icon.png');

  await sharp('public/images/logo-mark.png')
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');

  await sharp('public/images/logo-mark.png')
    .resize(180, 180)
    .png()
    .toFile('src/app/apple-icon.png');

  await sharp('public/images/logo-mark.png')
    .resize(180, 180)
    .png()
    .toFile('public/apple-icon.png');

  // 3. Multi-resolution Favicon.ico (contains 16x16, 32x32, 48x48)
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of sizes) {
    const buf = await sharp('public/images/logo-mark.png')
      .resize(s, s)
      .toFormat('png')
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // Build standard multi-image ICO binary
  const count = pngBuffers.length;
  let offset = 6 + count * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size, 0); // width
    entry.writeUInt8(img.size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  const icoFinal = Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((b) => b.buffer),
  ]);

  fs.writeFileSync('src/app/favicon.ico', icoFinal);
  fs.writeFileSync('public/favicon.ico', icoFinal);
  console.log('Generated src/app/favicon.ico and public/favicon.ico (16, 32, 48px)');

  // 4. Clean Open Graph image (1200x630)
  await sharp('public/images/og-image.jpg')
    .resize(1200, 630, { fit: 'cover' })
    .png({ quality: 95 })
    .toFile('public/og-image.png');
  
  // Also copy to src/app/opengraph-image.png for native Next.js automatic OG metadata detection!
  await sharp('public/og-image.png')
    .toFile('src/app/opengraph-image.png');

  console.log('Generated public/og-image.png and src/app/opengraph-image.png');
}

processLogo().catch(err => {
  console.error(err);
  process.exit(1);
});
