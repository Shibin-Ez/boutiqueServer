import pool from "../config/pool.js";

// CREATE
export const addComment = async (req, res) => {
  try {
    const userId = req.params.id;
    const { postId, comment, rating } = req.body;

    const [rows] = await pool.query(
      `INSERT INTO Comment (userId, postId, comment, rating) VALUES (?, ?, ?, ?)`,
      [userId, postId, comment, rating]
    );

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

// READ
export const getComments = async (req, res) => {
  try {
    const postId = req.params.postId;

    const [rows] = await pool.query(`SELECT * FROM Comment WHERE postId = ?`, [
      postId,
    ]);

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

// DELETE
export const removeComment = async (req, res) => {
  try {
    const userId = req.params.id;
    const { commentId } = req.body;

    const [rows] = await pool.query(`DELETE FROM Comment WHERE id = ?`, [
      commentId,
    ]);

    res.status(200).send({ message: "Comment deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};