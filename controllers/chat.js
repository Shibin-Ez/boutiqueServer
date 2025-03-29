import pool from "../config/pool.js";

// CREATE
export const saveMessage = async (senderId, receiverId, content) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO Chat (senderId, receiverId, content) VALUES (?, ?, ?)`,
      [senderId, receiverId, content]
    );
    return result.insertId; // Return inserted message ID
  } catch (err) {
    console.error("Error saving message:", err);
    return null;
  }
};

// READ
export const getChatHistory = async (senderId, receiverId) => {
  try {
    const [messages] = await pool.query(
      `SELECT * FROM Chat 
           WHERE (senderId = ? AND receiverId = ?) 
              OR (senderId = ? AND receiverId = ?) 
           ORDER BY timestamp ASC`,
      [senderId, receiverId, receiverId, senderId]
    );

    return messages;
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return [];
  }
};

export const getChatUserList = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    const [users] = await pool.query(`
      SELECT 
        u.id AS userId,
        u.name AS senderName,
        u.profilePicURL,
        c.id AS lastMessageId,
        c.content AS lastMessage,
        c.timestamp AS timestamp,
        c.senderId,
        c.receiverId
      FROM Chat c
      JOIN User u ON (u.id = c.senderId OR u.id = c.receiverId) 
      WHERE (c.senderId = ? OR c.receiverId = ?) 
      AND u.id != ?  -- Exclude the user themselves
      AND c.timestamp = (
        SELECT MAX(c2.timestamp) 
        FROM Chat c2 
        WHERE (c2.senderId = u.id AND c2.receiverId = ?) 
          OR (c2.receiverId = u.id AND c2.senderId = ?)
      )
      ORDER BY c.timestamp DESC;
    `, [userId, userId, userId, userId, userId])

    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
}