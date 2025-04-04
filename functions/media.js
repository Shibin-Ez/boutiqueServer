import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export const compressImage = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = await fs.stat(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > 1 || metadata.width > 2000) {
      const tempPath = `${filePath}-compressed.webp`;

      await sharp(filePath)
        .resize({ width: 1280 })
        .webp({ quality: 70 })
        .toFile(tempPath);

      await fs.rename(tempPath, filePath); // Replace original
      console.log("Image compressed successfully.");
    } else {
      console.log("Image small/optimized, no compression needed.");
    }
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

export const compressVideo = async (filePath) => {
  const stats = await fs.stat(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);

  if (fileSizeInMB <= 8) {
    console.log("Video saved without compression.");
    return;
  }

  const tempPath = `${filePath}-compressed.mp4`;

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions([
        "-vcodec libx264",
        "-crf 28",               // controls compression (lower = better quality, higher = more compression)
        "-preset medium",        // affects encoding speed vs. compression
        "-acodec aac",           // audio codec
        "-movflags +faststart"   // allows video to start streaming before full download
      ])
      .on("end", async () => {
        try {
          await fs.unlink(filePath);             // delete original
          await fs.rename(tempPath, filePath);   // replace with compressed
          console.log("Video compressed successfully.");
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => {
        console.error("FFmpeg compression error:", err);
        reject(err);
      })
      .save(tempPath);
  });
};