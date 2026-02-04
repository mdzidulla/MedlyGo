const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../public/logo_medlygo.PNG');
const outputDir = path.join(__dirname, '../public');
const appDir = path.join(__dirname, '../src/app');

async function generateFavicons() {
  try {
    console.log('Generating favicons from logo...');

    // Create favicon.ico (32x32)
    await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'favicon-32.png'));

    // Create various sizes for different devices
    const sizes = [16, 32, 48, 64, 128, 180, 192, 512];

    for (const size of sizes) {
      await sharp(inputPath)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(outputDir, `favicon-${size}.png`));
      console.log(`Created favicon-${size}.png`);
    }

    // Create apple-touch-icon (180x180)
    await sharp(inputPath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Created apple-touch-icon.png');

    // Create favicon.ico from 32x32 png
    // Copy the 32x32 as the main favicon (Next.js will use this)
    await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(appDir, 'icon.png'));
    console.log('Created icon.png in app directory');

    // Create app icon for app directory
    await sharp(inputPath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(appDir, 'apple-icon.png'));
    console.log('Created apple-icon.png in app directory');

    console.log('\nFavicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
