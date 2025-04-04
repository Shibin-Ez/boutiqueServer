import pool from "../config/pool.js";
import admin from "firebase-admin";

// FUNCTIONS
async function getAccessToken() {
  const accessToken = await admin.credential.applicationDefault().getAccessToken();
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
    "Authorization": `Bearer ${accessToken}`,
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
}


// CREATE
export const createNotification = async (senderShopId, receiverId, content) => {
  try {

    const [rows] = await pool.query(
      `INSERT INTO UserNotification (senderShopId, receiver, content) VALUES (?, ?, ?)`,
      [senderShopId, receiverId, content]
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
