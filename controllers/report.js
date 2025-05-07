import pool from "../config/pool.js";

// CREATE
export const createReport = async (req, res) => {
  try {
    const { userId, postId, reason } = req.body;
    const [rows] = await pool.query(
      "INSERT INTO Report (userId, postId, reason) VALUES (?, ?, ?)",
      [userId, postId, reason]
    );

    res.status(201).json({
      message: "Report created successfully",
      reportId: rows.insertId,
    });
  } catch (error) {
    // Handle Duplicate Entry Error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "User already reported" });
    }

    console.error("Error creating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// READ
export const getReportsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const [rows] = await pool.query(`
      SELECT u.name AS reporterName, u.id AS reporterId, r.reason, r.timestamp AS date FROM Report r
      JOIN User u ON r.userId = u.id
      WHERE r.postId = ?`,
      [postId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}