const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  quality: 80,
  webp: true,
  sizes: [400, 800, 1200, 1600], // Different sizes for responsive images
  inputDir: 'image',
  outputDir: 'image/optimized',
  formats: ['webp', 'avif'], // Add AVIF support for modern browsers
  optimization: {
    mozjpeg: true, // Use mozjpeg for better JPEG compression
    oxipng: true,  // Use oxipng for better PNG compression
    webp: {
      quality: 80,
      effort: 6    // Higher effort for better compression
    },
    avif: {
      quality: 60, // AVIF can use lower quality due to better compression
      effort: 6
    }
  }
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

    // Process each format
    for (const format of config.formats) {
      const formatPath = outputPath.replace(/\.[^.]+$/, `.${format}`);
      
      let pipeline = image
        .resize(newWidth, newHeight, {
          fit: 'cover',
          position: 'attention' // Use AI-based focal point detection
        });

      // Apply format-specific optimizations
      switch (format) {
        case 'webp':
          pipeline = pipeline.webp(config.optimization.webp);
          break;
        case 'avif':
          pipeline = pipeline.avif(config.optimization.avif);
          break;
      }

      await pipeline.toFile(formatPath);
      console.log(`Optimized: ${inputPath} -> ${formatPath}`);
    }

    // Create original format version with optimization
    await image
      .resize(newWidth, newHeight)
      .jpeg({ 
        quality: config.quality,
        mozjpeg: config.optimization.mozjpeg 
      })
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
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Create corresponding output directory
      const outputDir = path.join(config.outputDir, file);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      await processDirectory(filePath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      // Process each size for the image
      for (const size of config.sizes) {
        const outputPath = path.join(
          config.outputDir,
          path.relative(config.inputDir, filePath).replace(/\.[^.]+$/, `-${size}$&`)
        );
        await optimizeImage(filePath, outputPath, size);
      }
    }
  }
}

// Start processing
processDirectory(config.inputDir)
  .then(() => console.log('Image optimization complete!'))
  .catch(error => console.error('Error during optimization:', error)); 