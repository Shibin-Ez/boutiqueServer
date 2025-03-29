import pool from "../config/pool.js";

// CREATE
export const addLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    const [rows] = await pool.query(
      `INSERT INTO \`Like\` (userId, postId) VALUES (?, ?)`,
      [userId, postId]
    );

    res.status(200).send({ message: "Like added successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

// READ
export const getLikesCount = async (req, res) => {
  try {
    const postId = req.params.id;

    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM \`Like\` WHERE postId = ?`,
      [postId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getUserLikes = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId);

    const [likes] = await pool.query(
      `
      SELECT l.*, p.*, s.name AS shopName
      FROM \`Like\` l
      LEFT JOIN Post p ON l.postId = p.id
      LEFT JOIN Shop s ON p.shopId = s.id
      WHERE l.userId = ?
      ORDER BY l.timestamp DESC`,
      [userId]
    );

    const updatedLikes = likes.map((like) => ({
      ...like,
      fileURL1: `${process.env.SERVER_URL}/public/assets/posts/${like.fileURL1}`,
      fileURL2:
        like.fileURL2 &&
        `${process.env.SERVER_URL}/public/assets/posts/${like.fileURL2}`,
      fileURL3:
        like.fileURL3 &&
        `${process.env.SERVER_URL}/public/assets/posts/${like.fileURL3}`,
      fileURL4:
        like.fileURL4 &&
        `${process.env.SERVER_URL}/public/assets/posts/${like.fileURL4}`,
      fileURL5:
        like.fileURL5 &&
        `${process.env.SERVER_URL}/public/assets/posts/${like.fileURL5}`,
    }));

    res.status(200).json(updatedLikes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

// DELETE
export const removeLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    const [rows] = await pool.query(
      `DELETE FROM \`Like\` WHERE userId = ? AND postId = ?`,
      [userId, postId]
    );

    res.status(200).send({ message: "Like removed successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
