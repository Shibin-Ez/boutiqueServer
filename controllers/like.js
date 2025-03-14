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
}

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
}

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
}