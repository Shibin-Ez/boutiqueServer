import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export const compressImage = async (filePath, outputPath) => {
  const metadata = await sharp(filePath).metadata();

  // Check for large files or oversized images
  const stats = fs.statSync(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);

  if (fileSizeInMB > 1 || metadata.width > 2000) {
    await sharp(filePath)
      .resize({ width: 1280 }) // auto-scale height
      .webp({ quality: 70 })   // adjust quality
      .toFile(outputPath);

    fs.unlinkSync(filePath); // remove original
    console.log("Image compressed and saved at:", outputPath);
  } else {
    fs.renameSync(filePath, outputPath); // just move
    console.log("Image saved without compression.");
  }
};

export const compressVideo = async (inputPath, outputPath) => {
  const stats = fs.statSync(inputPath);
  const fileSizeInMB = stats.size / (1024 * 1024);

  if (fileSizeInMB > 8) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vcodec libx264',
          '-crf 28',
          '-preset medium',
          '-acodec aac',
          '-movflags +faststart'
        ])
        .on('end', () => {
          fs.unlinkSync(inputPath);
          console.log("Video compressed:", outputPath);
          resolve();
        })
        .on('error', (err) => {
          console.error("FFmpeg compression error:", err);
          reject(err);
        })
        .save(outputPath);
    });
  } else {
    fs.renameSync(inputPath, outputPath);
    console.log("Video saved without compression.");
    return;
  }
};
