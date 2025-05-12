import pool from "../config/pool.js";
import admin from "firebase-admin";
import axios from "axios";
import { profile } from "console";

// FUNCTIONS
export const subscribeToTopic = async (token, topic) => {
  try {
    // const response = await axios.post(url, {}, { headers });
    const response = await admin.messaging().subscribeToTopic(token, topic);
    console.log("Subscribed successfully:", response);
    return true;
  } catch (error) {
    console.error("Subscription failed:", error.response);
    return false;
  }
};

export const subscribeToTopics = async (req, res) => {
  try {
    console.log("Subscribing to topics");
    const userId = req.params.userId;
    const { deviceToken } = req.body;
    console.log(req.body);

    if (!deviceToken) {
      return res.status(400).json({ error: "Device token is required" });
    }

    // Subscribe to his own topic
    const userTopic = `user_${userId}`;
    const userSubscription = await subscribeToTopic(deviceToken, userTopic);
    if (userSubscription) console.log("Subscribed to self " + userTopic);

    // Subscribe to his own shop topic
    const [shop] = await pool.query(`SELECT id FROM Shop WHERE userId = ?`, [
      userId,
    ]);
    if (shop.length) {
      const shopTopic = `myshop_${shop[0].id}`;
      const shopSubscription = await subscribeToTopic(deviceToken, shopTopic);
      if (shopSubscription) console.log("Subscribed to self " + shopTopic);
    } else {
      console.log("No shop found for user " + userId);
    }

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

export const unsubscribeFromTopic = async (token, topic) => {
  try {
    const response = await admin.messaging().unsubscribeFromTopic(token, topic);
    console.log("Unsubscribed successfully:", response);
    return true;
  } catch (error) {
    console.error("Unsubscription failed:", error.response || error.message);
    return false;
  }
};

export const unsubscribeFromTopics = async (req, res) => {
  try {
    console.log("Unsubscribing from topics");
    const userId = req.params.userId;
    const { deviceToken } = req.body;
    console.log(req.body);

    if (!deviceToken) {
      return res.status(400).json({ error: "Device token is required" });
    }

    // Unsubscribe from his own topic
    const userTopic = `user_${userId}`;
    const userUnsubscription = await unsubscribeFromTopic(
      deviceToken,
      userTopic
    );
    if (userUnsubscription) console.log("Unsubscribed from self " + userTopic);

    // Unsubscribe from his own shop topic
    const [shop] = await pool.query(`SELECT id FROM Shop WHERE userId = ?`, [
      userId,
    ]);
    if (shop.length) {
      const shopTopic = `myshop_${shop[0].id}`;
      const shopUnsubscription = await unsubscribeFromTopic(
        deviceToken,
        shopTopic
      );
      if (shopUnsubscription)
        console.log("Unsubscribed from self " + shopTopic);
    } else {
      console.log("No shop found for user " + userId);
    }

    // Unsubscribe from followed shops
    const [followedShops] = await pool.query(
      `SELECT shopId FROM Follow WHERE userId = ?`,
      [userId]
    );

    let count = 0;
    for (const shop of followedShops) {
      const shopTopic = `shop_${shop.shopId}`;
      const shopUnsubscription = await unsubscribeFromTopic(
        deviceToken,
        shopTopic
      );
      if (shopUnsubscription) count++;
    }

    console.log(
      `Unsubscribed from ${count}/${followedShops.length} shop topics`
    );
    res.status(200).json({
      message: `Unsubscribed from ${count}/${followedShops.length} shop topics`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};

export const sendNotificationToTopic = async (
  topic,
  title,
  body,
  data = {}
) => {
  try {
    const fullData = {
      ...data,
      profilePicURL: data.profilePicURL || "", // Include default or existing value
    };

    const formattedData = Object.fromEntries(
      Object.entries(fullData).map(([key, value]) => [key, String(value)])
    );

    const message = {
      notification: {
        title,
        body,
      },
      data: formattedData,
      topic,

      // Android-specific settings
      android: {
        priority: "high",
        notification: {
          channelId: "high_importance_channel",
        },
      },

      // iOS (APNs) settings
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
    return true;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return false;
  }
};

export const sendChatNotification = async ({
  receiverId,
  senderId,
  senderName,
  message,
  shopId,
  profilePicURL,
}) => {
  const topic = `user_${receiverId}`;
  const roomId =
    [parseInt(senderId), parseInt(receiverId)].sort().join("_") + `_${shopId}`;

  const messageBody = {
    type: "chat",
    channel: topic,
    room_id: roomId,
    senderId: String(senderId),
    receiverId: String(receiverId),
    shopId: String(shopId),
    profilePicURL,
  };

  const success = await sendNotificationToTopic(
    topic,
    senderName, // Title
    message, // Body
    messageBody // Message payload (aka messageBody in Flutter)
  );

  console.log("Push notification sent:", success);
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

export const getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId;

    const [posts] = await pool.query(
      `
      SELECT
        p.title,
        s.id AS senderId,
        s.name AS senderName,
        s.profilePicURL AS senderProfilePicURL,
      FROM Post p
        JOIN Shop s ON p.shopId = s.id
      WHERE p.shopId IN (
          SELECT f.shopId
          FROM Follow f
          WHERE f.userId = ?
        ) && p.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY);
      `,
      [userId]
    );

    const notifications = posts.map((post) => {
      return {
        senderId: post.shopId,
        senderName: post.shopName,
        senderProfilePicURL: `${process.env.SERVER_URL}/public/assets/shops/${post.profilePicURL}`,
        content: `New post ${post.title} from ${post.shopName}`,
      }
    })

    res.status(200).json(notifications);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
