import pool from "../config/pool.js";
import { createNotification } from "./notification.js";

// CREATE

export const createFollow = async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const { userId, userName } = req.body;

    const [rows] = await pool.query(
      `INSERT INTO Follow (userId, shopId) VALUES (?, ?)`,
      [userId, shopId]
    );

    const notificationMessage = `${userName} has started following you`;
    const response = await createNotification(
      shopId,
      userId,
      notificationMessage
    );
    console.log(response.json());

    res
      .status(201)
      .json({ message: "followed successfully", notificationMessage });
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

    const [shops] = await pool.query(
      `
      SELECT s.* FROM Follow f
      LEFT JOIN Shop s ON f.shopId = s.id
      WHERE f.userId = ?
       `,
      [userId]
    );

    const updatedShops = shops.map((shop) => {
      return {
        ...shop,
        profilePicURL: `${process.env.SERVER_URL}/public/assets/posts/${shop.profilePicURL}`,
      };
    });

    res.status(200).json(updatedShops);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};

export const deleteFollow = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const userId = req.params.userId;

    const [rows] = await pool.query(
      `
      DELETE FROM Follow 
      WHERE userId = ? AND shopId = ?
      `,
      [userId, shopId]
    );

    res.status(200).json({ message: "unfollowed successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};
