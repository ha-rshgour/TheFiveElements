const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  quality: 80,
  webp: true,
  sizes: [400, 800, 1200], // Different sizes for responsive images
  inputDir: 'image',
  outputDir: 'image/optimized'
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Process each image
async function optimizeImage(inputPath, outputPath, size) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate new dimensions while maintaining aspect ratio
    const ratio = metadata.width / metadata.height;
    const newWidth = size;
    const newHeight = Math.round(size / ratio);

    // Create WebP version
    if (config.webp) {
      const webpPath = outputPath.replace(/\.[^.]+$/, '.webp');
      await image
        .resize(newWidth, newHeight)
        .webp({ quality: config.quality })
        .toFile(webpPath);
    }

    // Create original format version
    await image
      .resize(newWidth, newHeight)
      .jpeg({ quality: config.quality })
      .toFile(outputPath);

    console.log(`Optimized: ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

// Process all images in directory
async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const stat = fs.statSync(inputPath);
    
    if (stat.isDirectory()) {
      await processDirectory(inputPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const relativePath = path.relative(config.inputDir, inputPath);
      const outputBasePath = path.join(config.outputDir, relativePath);
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputBasePath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Process each size
      for (const size of config.sizes) {
        const outputPath = outputBasePath.replace(
          /(\.[^.]+)$/,
          `-${size}$1`
        );
        await optimizeImage(inputPath, outputPath, size);
      }
    }
  }
}

// Start processing
processDirectory(config.inputDir)
  .then(() => console.log('Image optimization complete!'))
  .catch(console.error); 