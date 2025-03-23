import pool from "../config/pool.js";

// CREATE

export const createFollow = async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const { userId } = req.body;

    const [rows] = await pool.query(
      `INSERT INTO Follow (userId, shopId) VALUES (?, ?)`,
      [userId, shopId]
    );

    res.status(201).json({ message: "followed successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};

// READ

export const getFollowers = async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const [followers] = await pool.query(
      `
      SELECT u.* FROM Follow f
      LEFT JOIN User u ON f.userId = u.id
      WHERE f.shopId = ?
       `,
      [shopId]
    );

    res.status(200).json(followers);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};

export const getFollowings = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [followings] = await pool.query(
      `
      SELECT s.* FROM Follow f
      LEFT JOIN Shop s ON f.shopId = s.id
      WHERE f.userId = ?
       `,
      [userId]
    );

    res.status(200).json(followings);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
}