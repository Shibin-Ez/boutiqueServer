import pool from "../config/pool.js";

// CREATE

// READ
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
      GROUP BY p.id
    `);
    params.push(userId, userId);

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
        GROUP BY p.id
      `);
      // Note: POINT expects longitude first, then latitude.
      params.push(userId, lng, lat, radius);
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
      GROUP BY p.id
    `);
    params.push(userId);

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
      fileURL1: `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL1}`,
      fileURL2: post.fileURL2 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL2}`,
      fileURL3: post.fileURL3 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL3}`,
      fileURL4: post.fileURL4 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL4}`,
      fileURL5: post.fileURL5 && `${process.env.SERVER_URL}/public/assets/posts/${post.fileURL5}`,
    }));

    res.status(200).json(updatedPosts);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getUserLikes = async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(`
      SELECT l.postId As postId, p.* FROM \`Like\` l
      JOIN Post p ON l.postId = p.id
      WHERE l.userId = ?
    `, [userId]);
  
    
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
