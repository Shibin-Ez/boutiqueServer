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
      SELECT * FROM User u
      JOIN Chat c ON c.senderId = u.id
      WHERE 
    `)
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
}