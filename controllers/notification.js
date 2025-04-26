import pool from "../config/pool.js";
import admin from "firebase-admin";
import axios from "axios";

// FUNCTIONS
async function getAccessToken() {
  const accessToken = await admin.credential
    .applicationDefault()
    .getAccessToken();
  return accessToken.access_token;
}

export const subscribeToTopic = async (token, topic) => {
  const accessToken = await getAccessToken(); // Get Firebase Admin token

  const url = "https://iid.googleapis.com/iid/v1:batchAdd";
  const payload = {
    to: `/topics/${topic}`,
    registration_tokens: [token], // The FCM token of the mobile device
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, payload, { headers });
    console.log("Subscribed successfully:", response.data);
    return true;
  } catch (error) {
    console.error("Subscription failed:", error.response.data);
    return false;
  }
};

export const subscribeToTopics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { deviceToken } = req.body;
    console.log(req.body);

    if (!deviceToken) {
      return res.status(400).json({ error: "Device token is required" });
    }

    // Subscribe to his own topic
    const userTopic = `user_${userId}`;
    const userSubscription = await subscribeToTopic(deviceToken, userTopic);
    if (!userSubscription) {
      return res
        .status(500)
        .json({ error: "Failed to subscribe to user topic" });
    }
    console.log("Subscribed to self " + userTopic);

    // Subscribe to followed shops
    const [followedShops] = await pool.query(
      `SELECT shopId FROM Follow WHERE userId = ?`,
      [userId]
    );

    let count = 0;
    for (const shop of followedShops) {
      const shopTopic = `shop_${shop.shopId}`;
      const shopSubscription = await subscribeToTopic(deviceToken, shopTopic);
      if (shopSubscription) count++;
    }

    console.log(`Subscribed to ${count}/${followedShops.length} shop topics`);
    res.status(200).json({
      message: `Subscribed to ${count}/${followedShops.length} shop topics`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};

// CREATE
export const createNotification = async (
  senderShopId,
  receiverId,
  content,
  type
) => {
  try {
    if (type === "follow") {
      const [rows] = await pool.query(
        `INSERT INTO ShopNotification (senderId, receiverShopId, content) VALUES (?, ?, ?)`,
        [senderShopId, receiverId, content]
      );
    } else {
      const [rows] = await pool.query(
        `INSERT INTO UserNotification (senderShopId, receiverId, content) VALUES (?, ?, ?)`,
        [senderShopId, receiverId, content]
      );
    }

    return {
      status: 201,
      message: "Notification created successfully",
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      message: err.message,
    };
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
