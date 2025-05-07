import pool from "../config/pool.js";

// CREATE

// READ
export const getUser = async (userId) => {
  try {
    const [users] = await pool.query(
      `SELECT name, profilePicURL FROM User WHERE id = ?`,
      [userId]
    );

    return users[0];
  } catch (err) {
    return "error";
  }
};

export const getUserFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // get location
    let lat = req.query.lat ? parseFloat(req.query.lat) : null;
    let lng = req.query.lng ? parseFloat(req.query.lng) : null;
    const radius = 20000; // 20 km in meters

    if (!lat || !lng) {
      // find location via ip
      lat = 0;
      lng = 0;
    }

    // building queries
    const queries = [];
    const params = [];

    // --- Part 1: Posts from shops followed by the user ---
    queries.push(`
      SELECT p.*, 
        s.name AS shopName, s.type AS shopType, 
        CONCAT('${process.env.SERVER_URL}/public/assets/shops/', s.profilePicURL) as shopProfilePicURL,
        COUNT(DISTINCT l.userId) AS likeCount,
        COUNT(DISTINCT c.id) AS commentCount,
        MAX(CASE WHEN l.userId = ? THEN 1 ELSE 0 END) AS isLiked
      FROM Post p
      JOIN Shop s ON p.shopId = s.id
      JOIN Follow f ON p.shopId = f.shopId
      LEFT JOIN \`Like\` l ON p.id = l.postId
      LEFT JOIN Comment c ON p.id = c.postId
      WHERE f.userId = ? 
        AND NOT EXISTS (
          SELECT 1 FROM Report r WHERE r.postId = p.id AND r.userId = ?
        )
      GROUP BY p.id
    `);
    params.push(userId, userId, userId);

    // --- Part 2: Posts from nearby shops (if location is provided) ---
    if (lat !== null && lng !== null) {
      queries.push(`
        SELECT p.*, 
          s.name AS shopName, s.type AS shopType, 
          CONCAT('${process.env.SERVER_URL}/public/assets/shops/', s.profilePicURL) as shopProfilePicURL,
          COUNT(DISTINCT l.userId) AS likeCount,
          COUNT(DISTINCT c.id) AS commentCount,
          MAX(CASE WHEN l.userId = ? THEN 1 ELSE 0 END) AS isLiked
        FROM Post p
        JOIN Shop s ON p.shopId = s.id
        LEFT JOIN \`Like\` l ON p.id = l.postId
        LEFT JOIN Comment c ON p.id = c.postId
        WHERE ST_Distance_Sphere(s.location, POINT(?, ?)) < ?
          AND NOT EXISTS (
            SELECT 1 FROM Report r WHERE r.postId = p.id AND r.userId = ?
          )
        GROUP BY p.id
      `);
      // Note: POINT expects longitude first, then latitude.
      params.push(userId, lng, lat, radius, userId);
    }

    // --- Part 3: Recent posts (all posts, as a fallback) ---
    queries.push(`
      SELECT p.*, 
        s.name AS shopName, s.type AS shopType, 
        CONCAT('${process.env.SERVER_URL}/public/assets/shops/', s.profilePicURL) as shopProfilePicURL,
        COUNT(DISTINCT l.userId) AS likeCount,
        COUNT(DISTINCT c.id) AS commentCount,
        MAX(CASE WHEN l.userId = ? THEN 1 ELSE 0 END) AS isLiked
      FROM Post p
      JOIN Shop s ON p.shopId = s.id
      LEFT JOIN \`Like\` l ON p.id = l.postId
      LEFT JOIN Comment c ON p.id = c.postId
      WHERE NOT EXISTS (
        SELECT 1 FROM Report r WHERE r.postId = p.id AND r.userId = ?
      )
      GROUP BY p.id
    `);
    params.push(userId, userId);

    // Combine the queries using UNION. (Duplicates may occur, so you might need to handle them if necessary.)
    const unionQuery = queries.join(" UNION ");

    // Wrap the union in a subquery to allow ordering and pagination.
    const finalQuery = `
      SELECT * FROM (
        ${unionQuery}
      ) AS feed
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const [posts] = await pool.query(finalQuery, params);

    const updatedPosts = posts.map((post) => ({
      ...post,
      fileURL1: `${process.env.SERVER_URL}/posts/file/${post.fileURL1}`,
      fileURL2:
        post.fileURL2 &&
        `${process.env.SERVER_URL}/posts/file/${post.fileURL2}`,
      fileURL3:
        post.fileURL3 &&
        `${process.env.SERVER_URL}/posts/file/${post.fileURL3}`,
      fileURL4:
        post.fileURL4 &&
        `${process.env.SERVER_URL}/posts/file/${post.fileURL4}`,
      fileURL5:
        post.fileURL5 &&
        `${process.env.SERVER_URL}/posts/file/${post.fileURL5}`,
      isLiked: post.isLiked == 1,
      fileTypes: [
        "image",
        post.fileURL2
          ? post.fileURL2.split(".").pop() === "mp4"
            ? "video"
            : "image"
          : null,
        post.fileURL3
          ? post.fileURL3.split(".").pop() === "mp4"
            ? "video"
            : "image"
          : null,
        post.fileURL4
          ? post.fileURL4.split(".").pop() === "mp4"
            ? "video"
            : "image"
          : null,
        post.fileURL5
          ? post.fileURL5.split(".").pop() === "mp4"
            ? "video"
            : "image"
          : null,
      ],
    }));

    res.status(200).json(updatedPosts);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getUserLikes = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [userLikes] = await pool.query(
      `
      SELECT l.postId As postId, p.* FROM \`Like\` l
      JOIN Post p ON l.postId = p.id
      WHERE l.userId = ?
    `,
      [userId]
    );

    res.status(200).json(userLikes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const checkPhoneNoExists = async (req, res) => {
  try {
    const { phone_no } = req.body;

    if (!phone_no)
      return res.status(400).json({ error: "Phone number is required" });

    const [users] = await pool.query(`SELECT * FROM User WHERE phone_no = ?`, [
      phone_no,
    ]);

    if (users.length) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(200).json({ status: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, phone_no, timestamp AS joinTime FROM User`
    );

    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await pool.query(
      `SELECT id, name, email, phone_no, timestamp AS joinTime FROM User WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(users[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
