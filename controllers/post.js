import pool from "../config/pool.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { compressImage, compressVideo } from "../functions/media.js";

const generateThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["00:00:02"], // Capture at 2 seconds
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: "320x240",
      })
      .on("end", () => resolve(thumbnailPath))
      .on("error", reject);
  });
};

// CREATE
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;

    const { title, price, discount_price, description, shopId } = req.body;
    console.log(req.body);

    if (!req.files.mainFile || req.files.mainFile.length === 0) {
      console.log("main file is required");
      return res.status(400).json({ message: "Main file is required" });
    }

    console.log(req.files);
    const file1 = req.files.mainFile[0];
    const additionalFiles = req.files.additionalFiles
      ? req.files.additionalFiles.map((file) => file)
      : [];
    const [file2, file3, file4, file5] = additionalFiles;

    // check if user is the owner of the shop
    const [shops] = await pool.query(`SELECT * FROM Shop WHERE userId = ?`, [
      userId,
    ]);

    if (!shops.length) {
      console.log("User does not have a shop");
      return res.status(400).json({ message: "User does not have a shop" });
    }

    // if (shops[0].id !== shopId) {
    //   console.log("User is not the owner of the shop");
    //   return res
    //     .status(400)
    //     .json({ message: "User is not the owner of the shop" });
    // }

    // create the post in db
    const [rows] = await pool.query(
      `INSERT INTO Post (title, price, discount_price, description, shopId, fileURL1, fileURL2, fileURL3, fileURL4, fileURL5) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        price,
        discount_price,
        description,
        shopId,
        file1.filename,
        file2.filename,
        file3.filename,
        file4.filename,
        file5.filename,
      ]
    );

    // compress the media files
    const files = [file1, file2, file3, file4, file5];
    for (const file of files) {
      if (file.mimetype.startsWith("image/")) {
        await compressImage(file.filename, file.filename);
      } else if (file.mimetype.startsWith("video/")) {
        await compressVideo(file.filename, file.filename);
      } else {
        return res.status(400).send("Unsupported file type.");
      }
    }

    res
      .status(201)
      .json({ id: rows.insertId, message: `post added successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// READ
export const getPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const userId = req.query.userId;

    const [posts] = await pool.query(`
      SELECT 
        p.*,
        JSON_OBJECT(
          'id', s.id,
          'name', s.name,
          'type', s.type,
          'profilePicURL', s.profilePicURL,
          'userId', u.id
        ) AS shop
      FROM Post p
      LEFT JOIN Shop s ON p.shopId = s.id
      LEFT JOIN User u ON s.userId = u.id
      WHERE p.id = ?`, [
      postId,
    ]);

    if (!posts.length) {
      return res.status(404).send("post not found");
    }

    let isLiked = false;

    if (userId && userId != -1) {
      const [rows] = await pool.query(`
        SELECT * FROM \`Like\` WHERE userId = ? AND postId = ?  
      `, [userId, postId])

      if (rows.length) isLiked = true;
    }

    const post = posts[0];

    const updatedPost = {
      ...post,
      fileURL1: `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL1}`,
      fileURL2: post.fileURL2 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL2}`,
      fileURL3: post.fileURL3 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL3}`,
      fileURL4: post.fileURL4 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL4}`,
      fileURL5: post.fileURL5 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL5}`,
      isLiked
    };

    res.status(200).json(updatedPost);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getPostsFromShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const [posts] = await pool.query(`SELECT * FROM Post WHERE shopId = ?`, [
      shopId,
    ]);

    const updatedPosts = await Promise.all(
      posts.map(async (post) => {
        const fileURLs = [
          "fileURL1",
          "fileURL2",
          "fileURL3",
          "fileURL4",
          "fileURL5",
        ];
        let updatedPost = { ...post, isVideo: false };

        for (let key of fileURLs) {
          if (post[key]) {
            const filePath = `public/assets/posts/${post[key]}`;

            if (
              post[key].endsWith(".mp4") ||
              post[key].endsWith(".mov") ||
              post[key].endsWith(".avi")
            ) {
              // Video
              const thumbnailPath = `public/assets/posts/thumbnails/${post[
                key
              ].replace(/\.\w+$/, ".jpg")}`;

              if (!fs.existsSync(thumbnailPath)) {
                await generateThumbnail(filePath, thumbnailPath);
              }

              updatedPost[
                key
              ] = `${process.env.SERVER_URL}/stream/video/${post[key]}`;

              updatedPost[`${key}_thumbnail`] = `${
                process.env.SERVER_URL
              }/public/assets/posts/thumbnails/${path.basename(thumbnailPath)}`;

              updatedPost["isVideo"] = true;
            } else {
              // Image
              updatedPost[
                key
              ] = `${process.env.SERVER_URL}/public/assets/posts/${post[key]}`;
            }
          }
        }

        return updatedPost;
      })
    );

    res.status(200).json(updatedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};
