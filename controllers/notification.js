import pool from "../config/pool.js";

// CREATE
export const createNotification = async (req, res) => {
  try {
    const senderShopId = req.query.senderShopId;

    const { receiver, content } = req.body;

    const [rows] = await pool.query(
      `INSERT INTO UserNotification (senderShopId, receiver, content) VALUES (?, ?, ?)`,
      [senderShopId, receiver, content]
    );

    res.status(201).json({ message: "notification added successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

// READ
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.query.userId;

    const [notifications] = await pool.query(
      `
      SELECT 
        n.*,
        s.name AS shopName,
        CONCAT(?, '/public/assets/shops/', s.profilePicURL) AS shopProfilePicURL
      FROM UserNotification n
      LEFT JOIN Shop s ON n.senderShopId = s.id
      WHERE n.receiverId = ?
    `,
      [process.env.SERVER_URL, userId]
    );

    res.status(200).json(notifications);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getShopNotifications = async (req, res) => {
  try {
    const shopId = req.query.shopId;

    const [notifications] = await pool.query(
      `
      SELECT 
        n.*,
        s.name AS shopName,
        CONCAT(?, '/public/assets/shops/', s.profilePicURL) AS shopProfilePicURL
      FROM ShopNotification n
      LEFT JOIN User u ON n.senderId = s.id
      WHERE n.recieverShopId = ?
    `,
      [process.env.SERVER_URL, shopId]
    );

    res.status(200).json(notifications);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
